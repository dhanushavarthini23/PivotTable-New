import React from 'react';
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

const getKey = (obj, fields) => fields.map(f => obj[f]).join(' | ');

const PivotTable = ({ data, rowFields, columnFields, measures }) => {
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
  const colKeys = new Set();
  rowKeys.forEach(rk => Object.keys(pivot[rk]).forEach(ck => colKeys.add(ck)));
  const sortedColKeys = [...colKeys].sort();

  const columnTotals = {};
  sortedColKeys.forEach(col => {
    measures.forEach(({ field, aggregation }) => {
      const values = rowKeys.flatMap(row => pivot[row]?.[col]?.[field] || []);
      columnTotals[`${col}-${field}-${aggregation}`] = calculate(values, aggregation);
    });
  });

  const grandTotal = Object.values(columnTotals).reduce((acc, val) => acc + parseFloat(val || 0), 0).toFixed(2);

  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
      <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 2 }}>
          <tr>
            <th style={{ backgroundColor: '#e0e0e0', position: 'sticky', top: 0, zIndex: 3 }}>
              <FontAwesomeIcon icon={faArrowsAltH} /> {columnFields.join(' / ')}
            </th>
            {sortedColKeys.map(col => (
              <th key={col} colSpan={measures.length} style={{ backgroundColor: '#e0e0e0', position: 'sticky', top: 0, zIndex: 3 }}>
                {col} <FontAwesomeIcon icon={faColumns} />
              </th>
            ))}
            <th rowSpan={2} style={{ backgroundColor: '#f0f0f0', position: 'sticky', top: 0, zIndex: 3 }}>
              Row Total <FontAwesomeIcon icon={faPlus} />
            </th>
          </tr>
          <tr>
            <th style={{ backgroundColor: '#e0e0e0', position: 'sticky', top: 38, zIndex: 3 }}>
              <FontAwesomeIcon icon={faArrowsAltH} /> {rowFields.join(' / ')}
            </th>
            {sortedColKeys.map(col =>
              measures.map(m => (
                <th key={`${col}-${m.field}-${m.aggregation}`} style={{ backgroundColor: '#f9f9f9', fontSize: '12px', position: 'sticky', top: 38, zIndex: 2 }}>
                  {m.field} ({m.aggregation}) <FontAwesomeIcon icon={faTh} />
                </th>
              ))
            )}
          </tr>
        </thead>

        <tbody>
          {rowKeys.map(row => {
            const rowTotal = measures.reduce((acc, m) => {
              const values = sortedColKeys.flatMap(col => pivot[row]?.[col]?.[m.field] || []);
              return acc + parseFloat(calculate(values, m.aggregation) || 0);
            }, 0).toFixed(2);

            return (
              <tr key={row}>
                <td style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold' }}>{row}</td>
                {sortedColKeys.map(col =>
                  measures.map(m => {
                    const values = pivot[row]?.[col]?.[m.field] || [];
                    return (
                      <td key={`${row}-${col}-${m.field}-${m.aggregation}`}>
                        {calculate(values, m.aggregation)}
                      </td>
                    );
                  })
                )}
                <td style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>{rowTotal}</td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr>
            <td style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
              Column Totals <FontAwesomeIcon icon={faPlus} />
            </td>
            {sortedColKeys.map(col =>
              measures.map(m => (
                <td key={`${col}-${m.field}-${m.aggregation}`} style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                  {columnTotals[`${col}-${m.field}-${m.aggregation}`]}
                </td>
              ))
            )}
            <td style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>{grandTotal}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default PivotTable;
