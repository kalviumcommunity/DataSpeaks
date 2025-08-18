import React, { useState } from 'react';

function ConnectionPage({ onConnect }) {
  const [connectionString, setConnectionString] = useState('');
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testConnection = async () => {
    if (!connectionString.trim()) return;
    
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/mongo/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionString.trim() }),
      });
      
      const result = await res.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  const connectToDatabase = async () => {
    if (!connectionString.trim()) return;
    
    setConnecting(true);
    setTestResult(null);

    try {
      console.log('🔗 Connecting to database...');
      const res = await fetch('/api/mongo/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionString.trim() }),
      });
      
      console.log('📡 Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Server responded with error:', errorText);
        
        let errorMessage = 'Connection failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        setTestResult({ success: false, message: errorMessage });
        return;
      }
      
      const result = await res.json();
      console.log('✅ Connection result:', result);
      
      if (result.success) {
        onConnect({
          connectionId: result.connectionId,
          collections: result.collections,
          databaseName: result.databaseName,
        });
      } else {
        setTestResult({ success: false, message: result.error || 'Connection failed' });
      }
    } catch (error) {
      console.error('💥 Connection error:', error);
      setTestResult({ success: false, message: `Network error: ${error.message}` });
    } finally {
      setConnecting(false);
    }
  };

  const sampleConnections = [
    'mongodb://localhost:27017/myapp',
    'mongodb+srv://user:password@cluster.mongodb.net/database',
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            MongoDB Query Platform
          </h1>
          <p className="text-gray-400 text-lg">
            Connect to your MongoDB database and query it using natural language
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Database Connection</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              MongoDB Connection String
            </label>
            <input
              type="text"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="mongodb://localhost:27017/myapp"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-2">Sample connection strings:</p>
              {sampleConnections.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => setConnectionString(sample)}
                  className="block text-xs text-blue-400 hover:text-blue-300 mb-1 font-mono"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {testResult && (
            <div className={`mb-4 p-3 rounded-lg ${
              testResult.success 
                ? 'bg-green-900/50 border border-green-700 text-green-200' 
                : 'bg-red-900/50 border border-red-700 text-red-200'
            }`}>
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  testResult.success ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                {testResult.message}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={testConnection}
              disabled={testing || !connectionString.trim()}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              onClick={connectToDatabase}
              disabled={connecting || !connectionString.trim() || (testResult && !testResult.success)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {connecting ? 'Connecting...' : 'Connect & Query'}
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">🔒 Security Notes:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Connection strings are encrypted before storage</li>
              <li>• Only read-only operations are supported</li>
              <li>• Connections are automatically limited and rate-limited</li>
              <li>• No sensitive data is logged or stored permanently</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectionPage;
