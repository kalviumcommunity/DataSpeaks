import { useState } from "react";
import SQLConnectionPage from "./pages/SQLConnectionPage";
import SQLQueryPage from "./pages/SQLQueryPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const [mode, setMode] = useState('select');
  const [connection, setConnection] = useState(null);
  const [view, setView] = useState('query'); // 'query' or 'dashboards'

  const resetApp = () => {
    setMode('select');
    setConnection(null);
  };

  const FloatingHomeButton = () => (
    <button
      onClick={resetApp}
      className="fixed top-6 right-6 z-50 p-4 bg-gray-800/70 backdrop-blur-md hover:bg-gray-700/80 
                 border border-gray-600/50 rounded-full text-gray-300 hover:text-white 
                 transition-all duration-300 shadow-2xl group"
      title="Back to Home"
    >
      <svg 
        className="w-6 h-6 group-hover:scale-110 transition-transform" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
        />
      </svg>
    </button>
  );

  const FullScreenBackground = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );

  if (mode === 'select') {
    return (
      <FullScreenBackground>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                DataSpeaks
              </h1>
              <p className="text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                AI-Powered SQL Query Platform
              </p>
              <p className="text-lg text-gray-500 mt-4">
                Transform natural language into SQL queries
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div 
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md rounded-3xl p-12 hover:from-gray-800/90 hover:to-gray-900/90 transition-all duration-300 cursor-pointer border border-gray-700/50 hover:border-purple-500/50 group transform hover:scale-105 shadow-2xl" 
                onClick={() => setMode('sql')}
              >
                <div className="text-8xl mb-8 group-hover:scale-110 transition-transform duration-300">💾</div>
                <h2 className="text-4xl font-bold mb-6 text-white group-hover:text-purple-400 transition-colors">
                  SQL Database Queries
                </h2>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  Connect to MySQL, PostgreSQL, SQLite, or SQL Server. 
                  Ask questions in plain English and get instant SQL results powered by Google Gemini AI.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-300">
                  <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-3">
                    <span className="text-purple-400">✓</span>
                    <span>MySQL, PostgreSQL, SQLite, MSSQL</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-3">
                    <span className="text-purple-400">✓</span>
                    <span>Natural language to SQL</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-3">
                    <span className="text-purple-400">✓</span>
                    <span>Secure read-only queries</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-3">
                    <span className="text-purple-400">✓</span>
                    <span>AI-generated explanations</span>
                  </div>
                </div>
                <button className="mt-8 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-blue-500 transition-all duration-200 shadow-lg hover:shadow-purple-500/50">
                  Get Started →
                </button>
              </div>
            </div>
            
            <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-500">
              <span className="flex items-center space-x-2">
                <span>🤖</span>
                <span>Powered by Google Gemini AI</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-2">
                <span>🔒</span>
                <span>Secure & Private</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Read-only Operations</span>
              </span>
            </div>
          </div>
        </div>
      </FullScreenBackground>
    );
  }

  if (mode === 'sql') {
    if (!connection) {
      return (
        <FullScreenBackground>
          <FloatingHomeButton />
          <SQLConnectionPage onConnect={setConnection} />
        </FullScreenBackground>
      );
    } else {
      return (
        <FullScreenBackground>
          <FloatingHomeButton />
          {view === 'query' ? (
            <SQLQueryPage 
              connection={connection} 
              onDisconnect={resetApp}
              onViewDashboards={() => setView('dashboards')}
            />
          ) : (
            <DashboardPage 
              connection={connection}
              onBack={() => setView('query')}
            />
          )}
        </FullScreenBackground>
      );
    }
  }

  return null;
}

export default App;
