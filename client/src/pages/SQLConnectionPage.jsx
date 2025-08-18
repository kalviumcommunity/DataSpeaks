import { useState } from 'react';

const SQLConnectionPage = ({ onConnect }) => {
  const [connectionString, setConnectionString] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [selectedDbType, setSelectedDbType] = useState('mysql');

  const dbTypes = [
    { id: 'mysql', name: 'MySQL', example: 'mysql://username:password@localhost:3306/database' },
    { id: 'postgresql', name: 'PostgreSQL', example: 'postgresql://username:password@localhost:5432/database' },
    { id: 'sqlite', name: 'SQLite', example: 'sqlite:///path/to/database.db' },
    { id: 'mssql', name: 'SQL Server', example: 'mssql://username:password@localhost:1433/database' }
  ];

  const sampleConnections = {
    mysql: [
      'mysql://root:password@localhost:3306/test',
      'mysql://user:pass@192.168.1.100:3306/inventory'
    ],
    postgresql: [
      'postgresql://postgres:password@localhost:5432/mydb',
      'postgresql://user:pass@localhost:5432/analytics'
    ],
    sqlite: [
      'sqlite:///home/user/database.db',
      'sqlite:///tmp/test.sqlite'
    ],
    mssql: [
      'mssql://sa:password@localhost:1433/TestDB',
      'mssql://user:pass@server:1433/ProductionDB'
    ]
  };

  const testConnection = async () => {
    if (!connectionString.trim()) return;
    
    setTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Testing SQL connection...');
      const res = await fetch('/api/sql/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionString.trim() }),
      });
      
      console.log('📡 Test response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Test server responded with error:', errorText);
        
        let errorMessage = 'Connection test failed';
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
      console.log('✅ Test result:', result);
      setTestResult(result);
    } catch (error) {
      console.error('💥 Test connection error:', error);
      setTestResult({ success: false, message: `Network error: ${error.message}` });
    } finally {
      setTesting(false);
    }
  };

  const connectToDatabase = async () => {
    if (!connectionString.trim()) return;
    
    setConnecting(true);
    setTestResult(null);

    try {
      console.log('🔗 Connecting to SQL database...');
      const res = await fetch('/api/sql/connect', {
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
          tables: result.tables,
          databaseName: result.databaseName,
          databaseType: result.databaseType,
          schema: result.schema,
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

  const fillSampleConnection = (sample) => {
    setConnectionString(sample);
    setTestResult(null);
  };

  const currentDbType = dbTypes.find(db => db.id === selectedDbType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0 2.21 1.79 4 4 4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Connect to SQL Database</h1>
              <p className="text-gray-600">MySQL, PostgreSQL, SQLite, SQL Server supported</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Connection Form */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Database Connection
            </h2>

            {/* Database Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Database Type</label>
              <div className="grid grid-cols-2 gap-2">
                {dbTypes.map((db) => (
                  <button
                    key={db.id}
                    onClick={() => {
                      setSelectedDbType(db.id);
                      setConnectionString('');
                      setTestResult(null);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedDbType === db.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{db.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Connection String Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection String
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder={currentDbType?.example || 'Enter your connection string'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={testConnection}
                disabled={!connectionString.trim() || testing}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Test Connection
                  </>
                )}
              </button>

              <button
                onClick={connectToDatabase}
                disabled={!connectionString.trim() || connecting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Connect
                  </>
                )}
              </button>
            </div>

            {/* Connection Status */}
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="font-medium">
                    {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                  </span>
                </div>
                <p className="mt-1 text-sm">{testResult.message}</p>
              </div>
            )}
          </div>

          {/* Sample Connections */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sample Connections
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-2">{currentDbType?.name} Examples</h3>
                <div className="space-y-2">
                  {sampleConnections[selectedDbType]?.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => fillSampleConnection(sample)}
                      className="w-full text-left p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-all text-sm font-mono"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">Connection Format</h3>
                <p className="text-sm text-green-700 font-mono bg-white p-2 rounded border">
                  {currentDbType?.example}
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-medium text-amber-800 mb-2">Security Notice</h3>
                <p className="text-sm text-amber-700">
                  • Only SELECT operations are allowed<br/>
                  • Connection strings are encrypted<br/>
                  • Read-only database access recommended
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLConnectionPage;
