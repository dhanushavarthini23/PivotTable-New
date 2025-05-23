import React, { useState } from 'react';
import './PivotControls.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faColumns,
  faChartBar,
  faDatabase,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';

const PivotControls = ({
  fields,
  rowFields,
  setRowFields,
  columnFields,
  setColumnFields,
  measures,
  setMeasures,
}) => {
  const [draggedField, setDraggedField] = useState(null);

  const handleDragStart = (field, type) => {
    setDraggedField({ field, type });
  };

  const handleDrop = (targetType) => {
    if (draggedField) {
      if (targetType === 'measure') {
        if (!measures.find((m) => m.field === draggedField.field)) {
          setMeasures([...measures, { field: draggedField.field, aggregation: 'SUM' }]);
        }
      } else if (targetType === 'row' && !rowFields.includes(draggedField.field)) {
        setRowFields([...rowFields, draggedField.field]);
      } else if (targetType === 'column' && !columnFields.includes(draggedField.field)) {
        setColumnFields([...columnFields, draggedField.field]);
      }
      setDraggedField(null);
    }
  };

  const handleAggregationChange = (field, aggregation) => {
    setMeasures(measures.map((m) => (m.field === field ? { ...m, aggregation } : m)));
  };

  const getAvailableFields = () => {
    const assignedFields = [
      ...rowFields,
      ...columnFields,
      ...measures.map((m) => m.field),
    ];
    return fields.filter((field) => !assignedFields.includes(field));
  };

  return (
    <div className="pivot-controls-container">
      <h4>PIVOT CONTROLS</h4>

      {/* Rows and Columns */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
        <div
          className="dropzone"
          onDrop={() => handleDrop('row')}
          onDragOver={(e) => e.preventDefault()}
        >
          <h5>
            <FontAwesomeIcon icon={faBars} style={{ marginRight: '8px' }} />
            Rows
          </h5>
          {rowFields.map((field, index) => (
            <div key={index} className="draggable-item">
              {field}
              <span onClick={() => setRowFields(rowFields.filter((f) => f !== field))}>
                <FontAwesomeIcon icon={faTrashAlt} />
              </span>
            </div>
          ))}
        </div>

        <div
          className="dropzone"
          onDrop={() => handleDrop('column')}
          onDragOver={(e) => e.preventDefault()}
        >
          <h5>
            <FontAwesomeIcon icon={faColumns} style={{ marginRight: '8px' }} />
            Columns
          </h5>
          {columnFields.map((field, index) => (
            <div key={index} className="draggable-item">
              {field}
              <span onClick={() => setColumnFields(columnFields.filter((f) => f !== field))}>
                <FontAwesomeIcon icon={faTrashAlt} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Measures */}
      <div
        className="dropzone"
        onDrop={() => handleDrop('measure')}
        onDragOver={(e) => e.preventDefault()}
      >
        <h5>
          <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '8px' }} />
          Measures
        </h5>
        {measures.map(({ field, aggregation }, index) => (
          <div key={index} className="draggable-item">
            {field} ({aggregation})
            <select
              value={aggregation}
              onChange={(e) => handleAggregationChange(field, e.target.value)}
              className="agg-select"
            >
              <option value="SUM">SUM</option>
              <option value="AVERAGE">AVERAGE</option>
              <option value="COUNT">COUNT</option>
              <option value="MIN">MIN</option>
              <option value="MAX">MAX</option>
              <option value="MEDIAN">MEDIAN</option>
            </select>
            <span onClick={() => setMeasures(measures.filter((m) => m.field !== field))}>
              <FontAwesomeIcon icon={faTrashAlt} />
            </span>
          </div>
        ))}
      </div>

      {/* Available Fields */}
      <div className="zones-container">
        <h5>
          <FontAwesomeIcon icon={faDatabase} style={{ marginRight: '8px' }} />
          Available Fields
        </h5>
        {getAvailableFields().map((field, index) => (
          <div
            key={index}
            className="draggable-item"
            draggable
            onDragStart={() => handleDragStart(field, 'field')}
          >
            {field}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PivotControls;
