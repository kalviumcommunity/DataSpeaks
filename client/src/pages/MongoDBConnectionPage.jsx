import { useState } from 'react';
import { getApiUrl } from '../config/api';

const MongoDBConnectionPage = ({ onConnect }) => {
  const [connectionString, setConnectionString] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const quickStartExamples = [
    {
      label: 'Local MongoDB (Default)',
      value: 'mongodb://localhost:27017/your_database',
      description: 'Connect to MongoDB running locally'
    },
    {
      label: 'MongoDB Atlas (Cloud)',
      value: 'mongodb+srv://username:password@cluster.mongodb.net/database',
      description: 'Connect to MongoDB Atlas cloud database'
    },
    {
      label: 'Custom Port',
      value: 'mongodb://username:password@localhost:27018/database',
      description: 'MongoDB on custom port'
    }
  ];

  const sampleConnections = [
    {
      name: 'Local Development',
      connection: 'mongodb://localhost:27017/myapp',
      description: 'No authentication'
    },
    {
      name: 'MongoDB Atlas',
      connection: 'mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/production',
      description: 'Cloud hosted'
    },
    {
      name: 'Authenticated Local',
      connection: 'mongodb://admin:password@localhost:27017/mydb?authSource=admin',
      description: 'With authentication'
    }
  ];

  const handleTest = async () => {
    if (!connectionString.trim()) {
      setTestResult({ success: false, message: 'Please enter a connection string' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(getApiUrl('/api/mongodb/test-connection'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection: ' + error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    if (!connectionString.trim()) {
      setTestResult({ success: false, message: 'Please enter a connection string' });
      return;
    }

    setConnecting(true);

    try {
      const response = await fetch(getApiUrl('/api/mongodb/connect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      });

      const data = await response.json();

      if (data.success) {
        onConnect({
          connectionId: data.connectionId,
          connectionString,
          databaseName: data.databaseName,
          collections: data.collections,
          tables: data.collections, // Also set as tables for compatibility
          schema: data.schema,
          databaseType: 'mongodb'
        });
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to connect: ' + error.message,
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-7xl mb-4 animate-bounce">🍃</div>
          <h1 className="text-5xl font-bold mb-4 text-gray-800">
            Connect to MongoDB
          </h1>
          <p className="text-xl text-gray-600">
            NoSQL document database with flexible schema
          </p>
        </div>

        {/* Main Connection Form */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-emerald-200 shadow-xl">
          
          {/* Connection String Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              MongoDB Connection String
            </label>
            <div className="relative">
              <input
                type="text"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                placeholder="mongodb://localhost:27017/database or mongodb+srv://..."
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-sm"
              />
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600"
                title="Show help"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Help Section */}
          {showHelp && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <h3 className="font-semibold text-emerald-800 mb-2">Connection String Format:</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><code className="bg-white px-2 py-1 rounded">mongodb://[username:password@]host[:port]/database</code></p>
                <p><code className="bg-white px-2 py-1 rounded">mongodb+srv://username:password@cluster.mongodb.net/database</code></p>
                <p className="text-xs text-gray-600 mt-2">
                  💡 Use <strong>mongodb+srv://</strong> for MongoDB Atlas cloud connections
                </p>
              </div>
            </div>
          )}

          {/* Quick Start Examples */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Start Examples</h3>
            <div className="grid gap-3">
              {quickStartExamples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setConnectionString(example.value)}
                  className="text-left p-4 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-xl border border-emerald-200 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 mb-1 group-hover:text-emerald-700">
                        {example.label}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">{example.description}</div>
                      <code className="text-xs bg-white px-2 py-1 rounded text-emerald-700">
                        {example.value}
                      </code>
                    </div>
                    <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleTest}
              disabled={testing || connecting}
              className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
            >
              {testing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                  Testing...
                </span>
              ) : (
                '🔍 Test Connection'
              )}
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting || testing}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-300 transition-all disabled:cursor-not-allowed"
            >
              {connecting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Connecting...
                </span>
              ) : (
                '🚀 Connect'
              )}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-xl border-2 ${
              testResult.success 
                ? 'bg-green-50 border-green-300 text-green-800' 
                : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{testResult.success ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">
                    {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                  </p>
                  <p className="text-sm opacity-90">{testResult.message}</p>
                  {testResult.success && testResult.details && (
                    <div className="mt-2 text-xs">
                      <p>Database: <strong>{testResult.details.database}</strong></p>
                      <p>Collections: <strong>{testResult.details.collections?.length || 0}</strong></p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sample Connections */}
        <div className="mt-8 bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-emerald-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📚 Sample Connections</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {sampleConnections.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setConnectionString(sample.connection)}
                className="text-left p-4 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-xl border border-emerald-200 transition-all"
              >
                <div className="font-semibold text-gray-800 mb-1">{sample.name}</div>
                <div className="text-xs text-gray-600 mb-2">{sample.description}</div>
                <code className="text-xs bg-white px-2 py-1 rounded block overflow-hidden text-ellipsis whitespace-nowrap">
                  {sample.connection}
                </code>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-emerald-200 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <div className="font-semibold text-gray-800">Secure</div>
            <div className="text-sm text-gray-600">Encrypted connections</div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-emerald-200 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold text-gray-800">Fast</div>
            <div className="text-sm text-gray-600">Quick query execution</div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-emerald-200 text-center">
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-semibold text-gray-800">AI-Powered</div>
            <div className="text-sm text-gray-600">Natural language queries</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MongoDBConnectionPage;
