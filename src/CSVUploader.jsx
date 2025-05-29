import React, { useState } from 'react';
import './CSVUploader.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileUpload } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';

const CSVUploader = ({ onUpload }) => {
  const [uploadStatus, setUploadStatus] = useState('');
  const [messageType, setMessageType] = useState('');

  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
    return regex.test(dateString);
  };

  const processData = (parsedData) => {
    return parsedData.map(row => {
      const newRow = { ...row };
      for (const key in row) {
        const value = row[key];
        if (isValidDate(value)) {
          const date = new Date(value);
          newRow[`${key}_Year`] = date.getFullYear();
          newRow[`${key}_Month`] = date.getMonth() + 1;
          newRow[`${key}_Day`] = date.getDate();
        }
      }
      return newRow;
    });
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'text/csv') {
        setUploadStatus('Error: Please upload a valid CSV file.');
        setMessageType('error');
        return;
      }

      setUploadStatus('Uploading...');
      setMessageType('');

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const processed = processData(results.data);
          onUpload(processed);
          setUploadStatus('Upload successful!');
          setMessageType('success');
        },
        error: () => {
          setUploadStatus('Error: Could not parse the file.');
          setMessageType('error');
        }
      });
    }
  };

  return (
    <div className="csv-upload-container">
      <label className="csv-upload-button">
        <FontAwesomeIcon icon={faFileUpload} /> Choose CSV File
        <input
          className="csv-upload-input"
          type="file"
          accept=".csv"
          onChange={handleChange}
        />
      </label>

      {uploadStatus && (
        <span
          className={
            messageType === 'success'
              ? 'csv-upload-success'
              : 'csv-upload-error'
          }
        >
          {uploadStatus}
        </span>
      )}
    </div>
  );
};

export default CSVUploader;
