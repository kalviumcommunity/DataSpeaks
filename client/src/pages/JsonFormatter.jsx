import React, { useState } from 'react';

const JsonFormatter = ({ data, maxHeight = '400px' }) => {
  const [collapsed, setCollapsed] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);

  const toggleCollapse = (path) => {
    setCollapsed(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const expandAll = () => {
    setCollapsed({});
  };

  const collapseAll = () => {
    const newCollapsed = {};
    const addPaths = (obj, path = 'root') => {
      if (Array.isArray(obj)) {
        newCollapsed[path] = true;
        obj.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            addPaths(item, `${path}[${index}]`);
          }
        });
      } else if (typeof obj === 'object' && obj !== null) {
        newCollapsed[path] = true;
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            addPaths(obj[key], `${path}.${key}`);
          }
        });
      }
    };
    addPaths(data);
    setCollapsed(newCollapsed);
  };

  const renderValue = (value, path = '', depth = 0) => {
    const isCollapsed = collapsed[path];
    
    if (value === null) {
      return <span className="text-red-400 font-medium">null</span>;
    }
    
    if (value === undefined) {
      return <span className="text-red-400 font-medium">undefined</span>;
    }
    
    if (typeof value === 'string') {
      // Check if it's a MongoDB ObjectId
      if (value.match(/^[0-9a-fA-F]{24}$/)) {
        return (
          <span className="text-purple-300">
            "<span className="text-purple-400 font-mono bg-purple-900/20 px-1 rounded">{value}</span>"
          </span>
        );
      }
      // Check if it's an ISO date
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return (
          <span className="text-yellow-300">
            "<span className="text-yellow-400 bg-yellow-900/20 px-1 rounded">{new Date(value).toLocaleString()}</span>"
          </span>
        );
      }
      return <span className="text-green-300">"{value}"</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-blue-300 font-medium bg-blue-900/20 px-1 rounded">{value.toLocaleString()}</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-orange-300 font-medium bg-orange-900/20 px-1 rounded">{String(value)}</span>;
    }
    
    if (value instanceof Date) {
      return <span className="text-yellow-300">"{value.toISOString()}"</span>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400">[]</span>;
      }
      
      return (
        <div className="inline-block w-full">
          <button
            onClick={() => toggleCollapse(path)}
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group py-1 px-2 rounded hover:bg-gray-800/50"
          >
            <svg 
              className={`w-3 h-3 transition-transform duration-200 text-blue-400 ${
                isCollapsed ? '' : 'rotate-90'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-blue-400 font-bold">Array</span>
            <span className="text-gray-400">[</span>
            <span className="text-blue-300 text-xs bg-blue-900/30 px-2 py-0.5 rounded">
              {value.length} {value.length === 1 ? 'item' : 'items'}
            </span>
            {isCollapsed && <span className="text-gray-400">...</span>}
          </button>
          
          {!isCollapsed && (
            <div className="ml-6 mt-2 border-l-2 border-blue-500/20 pl-4 space-y-1">
              {value.slice(0, 50).map((item, index) => (
                <div key={index} className="flex items-start gap-3 py-1">
                  <div className="text-blue-400 text-xs font-mono min-w-[3rem] bg-blue-900/20 px-2 py-1 rounded text-center">
                    [{index}]
                  </div>
                  <div className="flex-1">
                    {renderValue(item, `${path}[${index}]`, depth + 1)}
                    {index < Math.min(value.length - 1, 49) && <span className="text-gray-400 ml-1">,</span>}
                  </div>
                </div>
              ))}
              {value.length > 50 && (
                <div className="text-gray-500 text-sm italic bg-gray-800/30 px-3 py-2 rounded border border-gray-700/50">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                  ... and {value.length - 50} more items (showing first 50)
                </div>
              )}
            </div>
          )}
          
          {!isCollapsed && (
            <div className="mt-2">
              <span className="text-gray-400">]</span>
            </div>
          )}
        </div>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="text-gray-400">{'{}'}</span>;
      }
      
      return (
        <div className="inline-block w-full">
          <button
            onClick={() => toggleCollapse(path)}
            className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group py-1 px-2 rounded hover:bg-gray-800/50"
          >
            <svg 
              className={`w-3 h-3 transition-transform duration-200 text-purple-400 ${
                isCollapsed ? '' : 'rotate-90'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-purple-400 font-bold">Object</span>
            <span className="text-gray-400">{'{'}</span>
            <span className="text-purple-300 text-xs bg-purple-900/30 px-2 py-0.5 rounded">
              {keys.length} {keys.length === 1 ? 'key' : 'keys'}
            </span>
            {isCollapsed && <span className="text-gray-400">...</span>}
          </button>
          
          {!isCollapsed && (
            <div className="ml-6 mt-2 border-l-2 border-purple-500/20 pl-4 space-y-1">
              {keys.map((key, index) => (
                <div key={key} className="flex items-start gap-3 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-medium bg-cyan-900/20 px-2 py-1 rounded">"{key}"</span>
                    <span className="text-gray-400">:</span>
                  </div>
                  <div className="flex-1">
                    {renderValue(value[key], `${path}.${key}`, depth + 1)}
                    {index < keys.length - 1 && <span className="text-gray-400 ml-1">,</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isCollapsed && (
            <div className="mt-2">
              <span className="text-gray-400">{'}'}</span>
            </div>
          )}
        </div>
      );
    }
    
    return <span className="text-red-300 bg-red-900/20 px-1 rounded">{String(value)}</span>;
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800/50 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-white font-medium">Query Results</span>
          <div className="px-2 py-1 bg-green-600/20 text-green-300 rounded-lg text-xs font-medium">
            {Array.isArray(data) ? `${data.length} ${data.length === 1 ? 'record' : 'records'}` : 'Single result'}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5"
            title="Expand all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Expand All
          </button>
          
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 hover:text-orange-200 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5"
            title="Collapse all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m16 0l-4 4m4-4l-4-4" />
            </svg>
            Collapse All
          </button>
          
          <button
            onClick={copyToClipboard}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
              copySuccess 
                ? 'bg-green-600/20 text-green-300' 
                : 'bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 hover:text-gray-200'
            }`}
            title="Copy to clipboard"
          >
            {copySuccess ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy JSON
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* JSON Content */}
      <div 
        className="overflow-auto p-4 font-mono text-sm custom-scrollbar bg-gray-950/50" 
        style={{ maxHeight }}
      >
        {renderValue(data, 'root')}
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.8);
        }
      `}</style>
    </div>
  );
};

export default JsonFormatter;