import React, { useState } from 'react';
import './CSVUploader.css'; // Make sure path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileUpload } from '@fortawesome/free-solid-svg-icons';

const CSVUploader = ({ onUpload }) => {
  const [uploadStatus, setUploadStatus] = useState('');
  const [messageType, setMessageType] = useState('');

  const parseCSV = (text) => {
    const [headerLine, ...lines] = text.trim().split('\n');
    const headers = headerLine.split(',');
    return lines.map(line => {
      const values = line.split(',');
      return headers.reduce((acc, h, i) => ({ ...acc, [h]: values[i] }), {});
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
      const reader = new FileReader();
      reader.onload = () => {
        const data = parseCSV(reader.result);
        onUpload(data);
        setUploadStatus('Upload successful!');
        setMessageType('success');
      };
      reader.onerror = () => {
        setUploadStatus('Error: Could not read file.');
        setMessageType('error');
      };
      reader.readAsText(file);
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
