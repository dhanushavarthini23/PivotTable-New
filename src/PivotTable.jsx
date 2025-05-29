import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsAltH, faPlus, faColumns, faTh } from '@fortawesome/free-solid-svg-icons';

const calculate = (values, aggregation) => {
  const nums = values.map(Number).filter(v => !isNaN(v));
  if (!nums.length) return '';

  switch (aggregation) {
    case 'SUM': return nums.reduce((a, b) => a + b, 0).toFixed(2);
    case 'AVERAGE': return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
    case 'MIN': return Math.min(...nums).toFixed(2);
    case 'MAX': return Math.max(...nums).toFixed(2);
    case 'COUNT': return nums.length;
    case 'MEDIAN': {
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2)
        : sorted[mid].toFixed(2);
    }
    default: return '';
  }
};

const getKeyParts = (obj, fields) => fields.map(f => obj[f]);

const PivotTable = ({ data, rowFields, columnFields, measures }) => {
  const { pivot, rowKeyPartsList, colKeys, columnTotals, rowTotals, grandTotals } = useMemo(() => {
    const pivot = {};
    const rowMap = new Map();

    data.forEach(row => {
      const rowKeyParts = getKeyParts(row, rowFields);
      const rowKey = rowKeyParts.join('|');
      const colKey = getKeyParts(row, columnFields).join('|');

      if (!rowMap.has(rowKey)) rowMap.set(rowKey, rowKeyParts);

      if (!pivot[rowKey]) pivot[rowKey] = {};
      if (!pivot[rowKey][colKey]) pivot[rowKey][colKey] = {};

      measures.forEach(({ field }) => {
        if (!pivot[rowKey][colKey][field]) pivot[rowKey][colKey][field] = [];
        pivot[rowKey][colKey][field].push(Number(row[field]));
      });
    });

    // Sort row keys hierarchically
    const rowKeyPartsList = [...rowMap.values()].sort((a, b) => {
      for (let i = 0; i < a.length; i++) {
        const cmp = String(a[i]).localeCompare(String(b[i]));
        if (cmp !== 0) return cmp;
      }
      return 0;
    });

    const colKeySet = new Set();
    Object.values(pivot).forEach(cols => Object.keys(cols).forEach(k => colKeySet.add(k)));
    const colKeys = [...colKeySet].sort();

    const columnTotals = {};
    colKeys.forEach(col => {
      measures.forEach(({ field, aggregation }) => {
        const allValues = rowKeyPartsList.flatMap(rowParts => pivot[rowParts.join('|')]?.[col]?.[field] || []);
        columnTotals[`${col}-${field}-${aggregation}`] = calculate(allValues, aggregation);
      });
    });

    const rowTotals = {};
    rowKeyPartsList.forEach(rowParts => {
      const rowKey = rowParts.join('|');
      measures.forEach(({ field, aggregation }) => {
        const allValues = colKeys.flatMap(col => pivot[rowKey]?.[col]?.[field] || []);
        rowTotals[`${rowKey}-${field}-${aggregation}`] = calculate(allValues, aggregation);
      });
    });

    const grandTotals = {};
    measures.forEach(({ field, aggregation }) => {
      const allValues = rowKeyPartsList.flatMap(rowParts =>
        colKeys.flatMap(col => pivot[rowParts.join('|')]?.[col]?.[field] || [])
      );
      grandTotals[`${field}-${aggregation}`] = calculate(allValues, aggregation);
    });

    return { pivot, rowKeyPartsList, colKeys, columnTotals, rowTotals, grandTotals };
  }, [data, rowFields, columnFields, measures]);

  const colKeyParts = colKeys.map(col => col.split('|'));
  const columnLevels = columnFields.length;
  const rowLevels = rowFields.length;

  // Fixed: Calculate row spans for hierarchical row headers
  const getRowHeaderCells = (rows) => {
    const spans = Array(rows.length).fill(null).map(() => Array(rowLevels).fill(0));

    for (let level = 0; level < rowLevels; level++) {
      let startIndex = 0;
      for (let i = 1; i <= rows.length; i++) {
        if (
          i === rows.length ||
          rows[i][level] !== rows[i - 1][level] ||
          // Also check if any higher-level field differs — prevents merging across groups
          (level > 0 && rows[i][level - 1] !== rows[i - 1][level - 1])
        ) {
          const spanLength = i - startIndex;
          spans[startIndex][level] = spanLength;
          // All others in this group get 0 to skip rendering
          for (let j = startIndex + 1; j < i; j++) {
            spans[j][level] = 0;
          }
          startIndex = i;
        }
      }
    }
    return spans;
  };

  const rowHeaderSpans = getRowHeaderCells(rowKeyPartsList);

  // Column headers
  const headerRows = [];
  for (let level = 0; level < columnLevels; level++) {
    let cells = [];
    let lastLabel = null;
    let spanStart = 0;

    for (let i = 0; i < colKeyParts.length; i++) {
      const label = colKeyParts[i][level] || '';
      if (label !== lastLabel) {
        if (lastLabel !== null) {
          cells.push({ label: lastLabel, colSpan: (i - spanStart) * measures.length });
          spanStart = i;
        }
        lastLabel = label;
      }
    }
    if (lastLabel !== null) {
      cells.push({ label: lastLabel, colSpan: (colKeyParts.length - spanStart) * measures.length });
    }
    headerRows.push(cells);
  }

  const measureHeaderRow = colKeys.flatMap(col =>
    measures.map(m => ({
      label: `${m.field} (${m.aggregation})`,
      key: `${col}-${m.field}-${m.aggregation}`,
    }))
  );

  return (
    <div style={{ maxHeight: '600px', overflow: 'auto' }}>
      <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
          {headerRows.map((row, level) => (
            <tr key={`header-level-${level}`}>
              {level === 0 &&
                rowFields.map((field, i) =>
                  i === 0 ? (
                    <th
                      key={`row-head-${i}`}
                      rowSpan={columnLevels + 1}
                      style={{ backgroundColor: '#e0e0e0', position: 'sticky', left: 0, zIndex: 11 }}
                    >
                      <FontAwesomeIcon icon={faArrowsAltH} /> {field}
                    </th>
                  ) : (
                    <th
                      key={`row-head-${i}`}
                      rowSpan={columnLevels + 1}
                      style={{ backgroundColor: '#e0e0e0', position: 'sticky', left: 0, zIndex: 11 }}
                    >
                      {field}
                    </th>
                  )
                )}
              {row.map((cell, i) => (
                <th key={`header-${level}-${i}`} colSpan={cell.colSpan} style={{ backgroundColor: '#e0e0e0' }}>
                  {cell.label} <FontAwesomeIcon icon={faColumns} />
                </th>
              ))}
              {level === 0 && (
                <th rowSpan={columnLevels + 1} style={{ backgroundColor: '#f0f0f0' }}>
                  Row Total <FontAwesomeIcon icon={faPlus} />
                </th>
              )}
            </tr>
          ))}
          <tr>
            {measureHeaderRow.map(({ label, key }) => (
              <th key={key} style={{ fontSize: '12px', backgroundColor: '#f9f9f9' }}>
                {label} <FontAwesomeIcon icon={faTh} />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rowKeyPartsList.map((rowParts, rowIndex) => {
            const rowKey = rowParts.join('|');
            return (
              <tr key={rowKey}>
                {rowParts.map((part, i) => {
                  const span = rowHeaderSpans[rowIndex][i];
                  if (span > 0) {
                    return (
                      <td
                        key={`row-header-${rowIndex}-${i}`}
                        rowSpan={span}
                        style={{
                          backgroundColor: '#f9f9f9',
                          fontWeight: 'bold',
                          position: 'sticky',
                          left: i === 0 ? 0 : 'auto', // only first col sticky
                          zIndex: 1,
                          minWidth: 100,
                        }}
                      >
                        {part}
                      </td>
                    );
                  }
                  return null;
                })}
                {colKeys.map(col =>
                  measures.map(m => {
                    const values = pivot[rowKey]?.[col]?.[m.field] || [];
                    return (
                      <td key={`${rowKey}-${col}-${m.field}-${m.aggregation}`}>
                        {calculate(values, m.aggregation)}
                      </td>
                    );
                  })
                )}
                <td style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                  {measures.map(m => (
                    <div key={`row-total-${rowKey}-${m.field}`}>
                      {rowTotals[`${rowKey}-${m.field}-${m.aggregation}`]}
                    </div>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr>
            <td
              colSpan={rowFields.length}
              style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', position: 'sticky', left: 0 }}
            >
              Column Totals <FontAwesomeIcon icon={faPlus} />
            </td>
            {colKeys.map(col =>
              measures.map(m => (
                <td
                  key={`col-total-${col}-${m.field}-${m.aggregation}`}
                  style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}
                >
                  {columnTotals[`${col}-${m.field}-${m.aggregation}`]}
                </td>
              ))
            )}
            <td style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
              {measures.map(m => (
                <div key={`grand-total-${m.field}`}>{grandTotals[`${m.field}-${m.aggregation}`]}</div>
              ))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PivotTable;
