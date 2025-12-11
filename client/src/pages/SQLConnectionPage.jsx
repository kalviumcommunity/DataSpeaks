import { useState } from 'react';
import { getApiUrl } from '../config/api';

const SQLConnectionPage = ({ onConnect }) => {
  const [connectionString, setConnectionString] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [selectedDbType, setSelectedDbType] = useState('mysql');
  const [showHelp, setShowHelp] = useState(false);

  const dbTypes = [
    { 
      id: 'mysql', 
      name: 'MySQL', 
      example: 'mysql://username:password@localhost:3306/database',
      description: 'Most popular open-source database',
      icon: '🐬'
    },
    { 
      id: 'postgres', 
      name: 'PostgreSQL', 
      example: 'postgresql://username:password@localhost:5432/database',
      description: 'Advanced open-source database',
      icon: '🐘'
    },
    { 
      id: 'sqlite', 
      name: 'SQLite', 
      example: 'sqlite:///path/to/database.db',
      description: 'Lightweight file-based database',
      icon: '📁'
    },
    { 
      id: 'mssql', 
      name: 'SQL Server', 
      example: 'Server=localhost;Database=mydb;User Id=sa;Password=yourpassword;',
      description: 'Microsoft SQL Server',
      icon: '🗄️'
    }
  ];

  const quickStartExamples = {
    mysql: [
      {
        label: 'Local MySQL (Default)',
        value: 'mysql://root:password@localhost:3306/your_database',
        description: 'Connect to MySQL running on your computer'
      },
      {
        label: 'Remote MySQL Server',
        value: 'mysql://user:pass@192.168.1.100:3306/database',
        description: 'Connect to MySQL on another server'
      }
    ],
    postgres: [
      {
        label: 'Local PostgreSQL',
        value: 'postgresql://postgres:password@localhost:5432/your_database',
        description: 'Connect to PostgreSQL on your computer'
      },
      {
        label: 'Remote PostgreSQL',
        value: 'postgresql://user:pass@192.168.1.100:5432/database',
        description: 'Connect to PostgreSQL on another server'
      }
    ],
    sqlite: [
      {
        label: 'Local SQLite File',
        value: 'sqlite:///home/user/mydata.db',
        description: 'Connect to a local SQLite database file'
      },
      {
        label: 'Relative Path',
        value: 'sqlite://./database.db',
        description: 'SQLite file in current directory'
      }
    ],
    mssql: [
      {
        label: 'Local SQL Server',
        value: 'Server=localhost;Database=mydb;User Id=sa;Password=yourpassword;',
        description: 'Connect to SQL Server on your computer'
      },
      {
        label: 'Windows Authentication',
        value: 'Server=localhost;Database=mydb;Integrated Security=true;',
        description: 'Use Windows authentication'
      }
    ]
  };

  const sampleConnections = {
    mysql: [
      'mysql://root:password@localhost:3306/database_name',
      'mysql://user:pass@hostname:3306/db_name'
    ],
    postgres: [
      'postgresql://postgres:password@localhost:5432/database_name',
      'postgresql://user:pass@hostname:5432/db_name'
    ],
    sqlite: [
      'sqlite:///path/to/database.db',
      'sqlite://./mydata.db'
    ],
    mssql: [
      'Server=localhost;Database=mydb;User Id=sa;Password=yourpass;',
      'Server=192.168.1.100;Database=mydb;Integrated Security=true;'
    ]
  };

  const testConnection = async () => {
    if (!connectionString.trim()) return;
    
    setTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Testing SQL connection...');
      const res = await fetch(getApiUrl('/api/sql/test'), {
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
      const res = await fetch(getApiUrl('/api/sql/connect'), {
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
    <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">💾</span>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Connect to SQL Database
              </h1>
              <p className="text-gray-600 text-lg">MySQL, PostgreSQL, SQLite, SQL Server supported</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Connection Form */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-orange-200 shadow-xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-8 flex items-center gap-3">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Database Connection
            </h2>

            {/* Database Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">Database Type</label>
              <div className="grid grid-cols-2 gap-3">
                {dbTypes.map((db) => (
                  <button
                    key={db.id}
                    onClick={() => {
                      setSelectedDbType(db.id);
                      setConnectionString('');
                      setTestResult(null);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedDbType === db.id
                        ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-md'
                        : 'border-orange-200 hover:border-orange-300 text-gray-700 hover:bg-orange-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{db.icon}</span>
                      <div className="font-medium">{db.name}</div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{db.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Connection String Input */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Connection String
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder={currentDbType?.example || 'Enter your connection string'}
                  className="w-full px-4 py-4 bg-white border border-orange-200 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={testConnection}
                disabled={!connectionString.trim() || testing}
                className="flex-1 px-6 py-4 bg-white border border-orange-300 text-gray-700 rounded-xl hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Test Connection
                  </>
                )}
              </button>

              <button
                onClick={connectToDatabase}
                disabled={!connectionString.trim() || connecting}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Connect
                  </>
                )}
              </button>
            </div>

            {/* Connection Status */}
            {testResult && (
              <div className={`p-4 rounded-xl border ${
                testResult.success 
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-red-500/20 border-red-500/50 text-red-300'
              }`}>
                <div className="flex items-center gap-3">
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
                <p className="mt-2 text-sm opacity-90">{testResult.message}</p>
              </div>
            )}
          </div>

          {/* Sample Connections */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-orange-200 shadow-xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-8 flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sample Connections
            </h2>

            <div className="space-y-6">
                <div className="p-6 bg-orange-50/50 rounded-xl border border-orange-200">
                <h3 className="font-medium text-orange-700 mb-4 flex items-center gap-2">
                  <span className="text-lg">💾</span>
                  {currentDbType?.name} Examples
                </h3>
                <div className="space-y-3">
                  {sampleConnections[selectedDbType]?.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => fillSampleConnection(sample)}
                      className="w-full text-left p-4 bg-white rounded-lg border border-orange-200 hover:border-orange-400 hover:shadow-md transition-all text-sm font-mono text-gray-700 hover:text-gray-900"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-amber-50/50 rounded-xl border border-amber-200">
                <h3 className="font-medium text-amber-700 mb-4 flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Connection Format
                </h3>
                <p className="text-sm text-gray-700 font-mono bg-white p-4 rounded-lg border border-amber-200">
                  {currentDbType?.example}
                </p>
              </div>

              <div className="p-6 bg-yellow-50/50 rounded-xl border border-yellow-300">
                <h3 className="font-medium text-yellow-700 mb-4 flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  Security Notice
                </h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                    <span>Only SELECT operations are allowed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                    <span>Connection strings are encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                    <span>Read-only database access recommended</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLConnectionPage;