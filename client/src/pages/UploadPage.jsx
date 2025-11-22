import React, { useState } from 'react';
import { getApiUrl } from '../config/api';

function UploadPage({ onUpload }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (selectedFile) => {
    setFile(selectedFile);
    if (selectedFile && selectedFile.type === 'application/pdf') {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleInputChange = (e) => {
    handleFileChange(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      handleFileChange(droppedFile);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(getApiUrl('/api/upload'), { method: 'POST', body: formData });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error:', errorText);
        alert('Upload failed: ' + errorText);
        return;
      }
      
      const data = await res.json();
      localStorage.setItem('fileId', data.fileId);
      onUpload();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-black/90 backdrop-blur-xl rounded-3xl border border-gray-800/50 p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-gray-300 bg-clip-text text-transparent mb-2">
          DataSpeaks RAG
        </h1>
        <p className="text-gray-400">Upload your PDF to unlock AI conversations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="space-y-6">
          <div 
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              isDragOver 
                ? 'border-blue-500 bg-blue-500/10' 
                : file 
                ? 'border-green-500 bg-green-500/5' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Upload Icon */}
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-dashed mb-6 transition-all duration-300 ${
              file ? 'border-green-500 text-green-500' : 'border-gray-500 text-gray-400'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 16l3-3m0 0l-3-3m3 3H9m3 0v6" />
              </svg>
            </div>

            <div className="mb-6">
              <p className="text-xl font-semibold text-white mb-2">
                {file ? file.name : 'Drag and drop or'}
              </p>
              <p className="text-gray-400 text-sm">
                PDF files up to 10 MB
              </p>
            </div>

            {/* Upload Button */}
            <div className="space-y-4">
              <label className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl cursor-pointer transition-all duration-200 border border-gray-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                <span className="text-white font-medium">Upload File</span>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={handleInputChange}
                  className="hidden"
                />
              </label>
              
              <p className="text-gray-500 text-sm">
                or drag and drop your file here
              </p>
            </div>
          </div>

          {/* Process Button */}
          {file && (
            <button 
              onClick={uploadFile} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 
                         text-white py-4 px-6 rounded-xl font-semibold text-lg
                         hover:from-blue-500 hover:via-blue-400 hover:to-purple-500
                         disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed 
                         transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl
                         shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing PDF...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Upload & Process</span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* PDF Preview */}
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            PDF Preview
          </h3>
          
          <div className="bg-gray-800/50 rounded-xl p-4 h-80 flex items-center justify-center border border-gray-700/30">
            {previewUrl ? (
              <iframe 
                src={previewUrl} 
                className="w-full h-full rounded-lg"
                title="PDF Preview"
              />
            ) : (
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                <p className="text-lg font-medium mb-2">No PDF selected</p>
                <p className="text-sm">Upload a PDF to see preview</p>
              </div>
            )}
          </div>
          
          {file && (
            <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate mr-4">{file.name}</span>
                <span className="text-gray-400 whitespace-nowrap">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadPage;