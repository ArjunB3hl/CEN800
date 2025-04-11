import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import './App.css';

interface FileWithPreview extends File {
  preview?: string;
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection from input
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files) as FileWithPreview[];
      
      // Add preview URLs for image files
      newFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          file.preview = URL.createObjectURL(file);
        }
      });
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
      console.log('Files selected:', newFiles.map(f => f.name).join(', '));
    }
  };

  // Handle drag and drop events
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files) as FileWithPreview[];
      
      // Add preview URLs for image files
      newFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          file.preview = URL.createObjectURL(file);
        }
      });
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
      console.log('Files dropped:', newFiles.map(f => f.name).join(', '));
    }
  };

  // Remove a file from the selection
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      // Revoke object URL if it exists to prevent memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Trigger file input click
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus('Please select at least one file first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing to upload...');

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file); // 'files' must match the name expected by multer on the backend
    });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 90 ? 90 : newProgress; // Cap at 90% until complete
        });
      }, 300);

      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      
      // Clean up preview URLs
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      
      setUploadStatus(`Upload successful: ${data.files.length} file(s) uploaded!`);
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus(`Upload error: ${error.message}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="title">File Upload Portal</h1>
        <p className="subtitle">Drag & drop files or browse to upload</p>
        
        {/* Drag and drop area */}
        <div 
          className={`drop-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <div className="drop-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <p>Drop files here or click to browse</p>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            multiple 
            style={{ display: 'none' }}
          />
        </div>
        
        {/* File list */}
        {selectedFiles.length > 0 && (
          <div className="file-list">
            <h3>Selected Files ({selectedFiles.length})</h3>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index} className="file-item">
                  <div className="file-info">
                    {file.preview ? (
                      <img src={file.preview} alt={file.name} className="file-preview" />
                    ) : (
                      <div className="file-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </div>
                    )}
                    <div className="file-details">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <button 
                    className="remove-file" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    disabled={isUploading}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Upload button and progress */}
        <div className="upload-controls">
          <button 
            className="upload-button" 
            onClick={handleUpload} 
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>
          
          {isUploading && (
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <span className="progress-text">{Math.round(uploadProgress)}%</span>
            </div>
          )}
        </div>
        
        {/* Status message */}
        {uploadStatus && (
          <div className={`status-message ${uploadStatus.includes('error') ? 'error' : ''}`}>
            {uploadStatus}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
