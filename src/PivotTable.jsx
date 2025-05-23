import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsAltH, faPlus, faColumns, faTh } from '@fortawesome/free-solid-svg-icons';

// Utility to calculate aggregations
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

const getKey = (obj, fields) => fields.map(f => obj[f]).join(' | ');

const PivotTable = ({ data, rowFields, columnFields, measures }) => {
  const { pivot, rowKeys, colKeys, columnTotals, rowTotals, grandTotals } = useMemo(() => {
    const pivot = {};

    data.forEach(row => {
      const rowKey = getKey(row, rowFields);
      const colKey = getKey(row, columnFields);
      if (!pivot[rowKey]) pivot[rowKey] = {};
      if (!pivot[rowKey][colKey]) pivot[rowKey][colKey] = {};

      measures.forEach(({ field }) => {
        if (!pivot[rowKey][colKey][field]) pivot[rowKey][colKey][field] = [];
        pivot[rowKey][colKey][field].push(Number(row[field]));
      });
    });

    const rowKeys = Object.keys(pivot).sort();
    const colKeySet = new Set();
    rowKeys.forEach(rk => Object.keys(pivot[rk]).forEach(ck => colKeySet.add(ck)));
    const colKeys = [...colKeySet].sort();

    // Calculate column totals by aggregating all raw values from all rows for each column & measure
    const columnTotals = {};
    colKeys.forEach(col => {
      measures.forEach(({ field, aggregation }) => {
        const allValues = rowKeys.flatMap(row => pivot[row]?.[col]?.[field] || []);
        columnTotals[`${col}-${field}-${aggregation}`] = calculate(allValues, aggregation);
      });
    });

    // Calculate row totals by aggregating all raw values from all columns for each row & measure
    const rowTotals = {};
    rowKeys.forEach(row => {
      measures.forEach(({ field, aggregation }) => {
        const allValues = colKeys.flatMap(col => pivot[row]?.[col]?.[field] || []);
        rowTotals[`${row}-${field}-${aggregation}`] = calculate(allValues, aggregation);
      });
    });

    // Calculate grand totals by aggregating all raw values from all rows and columns for each measure
    const grandTotals = {};
    measures.forEach(({ field, aggregation }) => {
      const allValues = rowKeys.flatMap(row => colKeys.flatMap(col => pivot[row]?.[col]?.[field] || []));
      grandTotals[`${field}-${aggregation}`] = calculate(allValues, aggregation);
    });

    return { pivot, rowKeys, colKeys, columnTotals, rowTotals, grandTotals };
  }, [data, rowFields, columnFields, measures]);

  const colKeyParts = colKeys.map(col => col.split(' | '));
  const levels = columnFields.length;

  // Create header rows for hierarchical columns
  const headerRows = [];
  for (let level = 0; level < levels; level++) {
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
    <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
      <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
          {headerRows.map((row, level) => (
            <tr key={`header-level-${level}`}>
              {level === 0 && (
                <th
                  rowSpan={levels + 1}
                  style={{ backgroundColor: '#e0e0e0', position: 'sticky', left: 0, zIndex: 11 }}
                >
                  <FontAwesomeIcon icon={faArrowsAltH} /> {rowFields.join(' / ')}
                </th>
              )}
              {row.map((cell, i) => (
                <th
                  key={`header-${level}-${i}`}
                  colSpan={cell.colSpan}
                  style={{ backgroundColor: '#e0e0e0' }}
                >
                  {cell.label} <FontAwesomeIcon icon={faColumns} />
                </th>
              ))}
              {level === 0 && (
                <th rowSpan={levels + 1} style={{ backgroundColor: '#f0f0f0' }}>
                  Row Total <FontAwesomeIcon icon={faPlus} />
                </th>
              )}
            </tr>
          ))}

          {/* Measure row */}
          <tr>
            {measureHeaderRow.map(({ label, key }) => (
              <th key={key} style={{ fontSize: '12px', backgroundColor: '#f9f9f9' }}>
                {label} <FontAwesomeIcon icon={faTh} />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rowKeys.map(row => {
            return (
              <tr key={row}>
                <td style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold', position: 'sticky', left: 0 }}>
                  {row}
                </td>
                {colKeys.map(col =>
                  measures.map(m => {
                    const values = pivot[row]?.[col]?.[m.field] || [];
                    return (
                      <td key={`${row}-${col}-${m.field}-${m.aggregation}`}>
                        {calculate(values, m.aggregation)}
                      </td>
                    );
                  })
                )}
                <td style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                  {measures.map(m => (
                    <div key={`row-total-${row}-${m.field}`}>
                      {rowTotals[`${row}-${m.field}-${m.aggregation}`]}
                    </div>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr>
            <td style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', position: 'sticky', left: 0 }}>
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
                <div key={`grand-total-${m.field}`}>
                  {grandTotals[`${m.field}-${m.aggregation}`]}
                </div>
              ))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PivotTable;
