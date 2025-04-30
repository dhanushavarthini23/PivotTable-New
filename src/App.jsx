import React, { useState } from 'react';
import CSVUploader from './CSVUploader';
import PivotTable from './PivotTable';
import PivotControls from './PivotControls';

const App = () => {
  const [data, setData] = useState([]);
  const [fields, setFields] = useState([]);
  const [rowFields, setRowFields] = useState([]);
  const [columnFields, setColumnFields] = useState([]);
  const [measures, setMeasures] = useState([]);
  const [dateField, setDateField] = useState(null);
  const [datePart, setDatePart] = useState('');

  const handleUpload = (parsedData) => {
    setData(parsedData);
    const keys = Object.keys(parsedData[0] || {});
    setFields(keys);
    setRowFields([]);
    setColumnFields([]);
    setMeasures([]);
    setDateField(null);
    setDatePart('');
  };

  const showPivotTable = rowFields.length > 0 || columnFields.length > 0;

  return (
    <div style={styles.container}>
      
      <CSVUploader onUpload={handleUpload} />

      {data.length > 0 && (
        <div style={styles.mainContent}>
          {/* Left Panel */}
          <div style={styles.leftPanel}>
            {showPivotTable ? (
              <PivotTable
                data={data}
                rowFields={rowFields}
                columnFields={columnFields}
                measures={measures}
                dateField={dateField}
                datePart={datePart}
              />
            ) : (
              <div style={styles.previewBox}>
                <h3 style={styles.previewTitle}>CSV Preview</h3>
                <div style={styles.tableWrapper}>
                  <table style={styles.previewTable}>
                    <thead>
                      <tr>
                        {fields.map((field) => (
                          <th key={field}>{field}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {fields.map((field) => (
                            <td key={field}>{row[field]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div style={styles.rightPanel}>
            <PivotControls
              fields={fields}
              rowFields={rowFields}
              setRowFields={setRowFields}
              columnFields={columnFields}
              setColumnFields={setColumnFields}
              measures={measures}
              setMeasures={setMeasures}
              dateField={dateField}
              setDateField={setDateField}
              datePart={datePart}
              setDatePart={setDatePart}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '30px',
    fontFamily: 'Segoe UI, sans-serif',
    backgroundColor: '#fafafa',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    fontSize: '28px',
    marginBottom: '20px',
    color: '#333',
  },
  mainContent: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  previewBox: {
    maxHeight: '500px',
    overflowY: 'auto',
  },
  previewTitle: {
    marginBottom: '10px',
    fontSize: '18px',
    color: '#444',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  previewTable: {
    borderCollapse: 'collapse',
    width: '100%',
    fontSize: '14px',
  },
  rightPanel: {
    width: '320px',
  },
};

export default App;
