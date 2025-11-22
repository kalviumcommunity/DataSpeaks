import React, { useState } from 'react';
import { getApiUrl } from '../config/api';

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
      const res = await fetch(getApiUrl('/api/mongo/test'), {
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
      const res = await fetch(getApiUrl('/api/mongo/connect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionString.trim() }),
      });

      if (!res.ok) {
        const errorText = await res.text();
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
      setTestResult({ success: false, message: `Network error: ${error.message}` });
    } finally {
      setConnecting(false);
    }
  };

  const sampleConnections = [
    { label: 'Local Development', value: 'mongodb://localhost:27017/myapp' },
    { label: 'MongoDB Atlas', value: 'mongodb+srv://user:password@cluster.mongodb.net/database' },
    { label: 'Docker Instance', value: 'mongodb://mongo:27017/dockerapp' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900  to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl animate-bounce"></div>
      </div>

      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.74 4.23c-.84-1.1-2.53-1.1-3.37 0L8.82 6.18l-2.1.15c-1.37.1-2.29 1.52-1.74 2.74l.84 1.86-.84 1.86c-.55 1.22.37 2.64 1.74 2.74l2.1.15 1.55 1.95c.84 1.1 2.53 1.1 3.37 0l1.55-1.95 2.1-.15c1.37-.1 2.29-1.52 1.74-2.74L18.29 10l.84-1.86c.55-1.22-.37-2.64-1.74-2.74l-2.1-.15L13.74 4.23z"/>
              </svg>
            </div>
            <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent animate-gradient-x">
              MongoDB Query Platform
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Connect to your MongoDB database and unlock the power of natural language querying
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Welcome back, <span className="text-blue-400 font-semibold">harishb2006</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Connection Form */}
            <div className="lg:col-span-2">
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                  <h2 className="text-2xl font-bold text-white">Database Connection</h2>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
                    Connection String
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={connectionString}
                      onChange={(e) => setConnectionString(e.target.value)}
                      placeholder="mongodb://localhost:27017/myapp"
                      className="w-full bg-gray-800/50 border-2 border-gray-700 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 font-mono text-lg transition-all duration-300 group-hover:border-gray-600"
                    />
                    {connectionString && (
                      <button
                        onClick={() => setConnectionString('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Sample Connections */}
                <div className="mb-8">
                  <p className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Quick Start</p>
                  <div className="grid grid-cols-1 gap-3">
                    {sampleConnections.map((sample, index) => (
                      <button
                        key={index}
                        onClick={() => setConnectionString(sample.value)}
                        className="flex items-center gap-4 p-4 bg-gray-800/30 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600 rounded-xl transition-all duration-200 text-left group"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-blue-300"></div>
                        <div>
                          <div className="text-white font-medium">{sample.label}</div>
                          <div className="text-gray-400 font-mono text-sm truncate">{sample.value}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Display */}
                {testResult && (
                  <div className={`mb-8 p-4 rounded-2xl border-2 transition-all duration-500 animate-fade-in ${
                    testResult.success
                      ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-200'
                      : 'bg-red-900/30 border-red-500/50 text-red-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        testResult.success ? 'bg-emerald-500' : 'bg-red-500'
                      }`}>
                        {testResult.success ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium">{testResult.message}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={testConnection}
                    disabled={testing || !connectionString.trim()}
                    className="group relative overflow-hidden bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      {testing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                          </svg>
                          <span>Test Connection</span>
                        </>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={connectToDatabase}
                    disabled={connecting || !connectionString.trim() || (testResult && !testResult.success)}
                    className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      {connecting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Connect & Query</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              {/* Security Info */}
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Security</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    End-to-end encryption
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    Read-only operations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    Rate limiting enabled
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    No data persistence
                  </li>
                </ul>
              </div>

              {/* Features */}
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Features</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Natural language queries
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Real-time results
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Schema exploration
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Export capabilities
                  </li>
                </ul>
              </div>

              {/* Stats */}
              <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Platform Stats</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">12.5k</div>
                    <div className="text-xs text-gray-400">Queries Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">99.9%</div>
                    <div className="text-xs text-gray-400">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS animations */}
      <style>{`
        .animate-gradient-x {
          background-size: 400% 400%;
          animation: gradient-x 6s ease infinite;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default ConnectionPage;