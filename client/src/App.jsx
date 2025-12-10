import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import SQLConnectionPage from "./pages/SQLConnectionPage";
import SQLQueryPage from "./pages/SQLQueryPage";
import DashboardPage from "./pages/DashboardPage";
import { getApiUrl } from "./config/api";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('select');
  const [connection, setConnection] = useState(null);
  const [view, setView] = useState('query'); // 'query' or 'dashboards'

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    resetApp();
  };

  const resetApp = () => {
    setMode('select');
    setConnection(null);
  };

  const FloatingHomeButton = () => (
    <div className="fixed top-6 right-6 z-50 flex gap-3">
      {user && (
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-orange-200 shadow-lg">
          <img 
            src={user.picture} 
            alt={user.name} 
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm font-medium text-gray-700">{user.name}</span>
          <button
            onClick={handleLogout}
            className="ml-2 text-xs px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors"
          >
            Logout
          </button>
        </div>
      )}
      <button
        onClick={resetApp}
        className="p-4 bg-white/90 backdrop-blur-md hover:bg-white 
                   border border-orange-200 rounded-full text-orange-600 hover:text-orange-700 
                   transition-all duration-300 shadow-lg hover:shadow-orange-200 group"
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
    </div>
  );

  const FullScreenBackground = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-orange-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <FullScreenBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </FullScreenBackground>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (mode === 'select') {
    return (
      <FullScreenBackground>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 bg-clip-text text-transparent">
                DataSpeaks
              </h1>
              <p className="text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
                AI-Powered SQL Query Platform
              </p>
              <p className="text-lg text-gray-600 mt-4">
                Transform natural language into SQL queries
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div 
                className="bg-white/90 backdrop-blur-md rounded-3xl p-12 hover:bg-white transition-all duration-300 cursor-pointer border border-orange-200 hover:border-orange-400 group transform hover:scale-105 shadow-2xl hover:shadow-orange-200" 
                onClick={() => setMode('sql')}
              >
                <div className="text-8xl mb-8 group-hover:scale-110 transition-transform duration-300">💾</div>
                <h2 className="text-4xl font-bold mb-6 text-gray-800 group-hover:text-orange-600 transition-colors">
                  SQL Database Queries
                </h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Connect to MySQL, PostgreSQL, SQLite, or SQL Server. 
                  Ask questions in plain English and get instant SQL results powered by Google Gemini AI.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="flex items-center space-x-2 bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <span className="text-orange-500">✓</span>
                    <span>MySQL, PostgreSQL, SQLite, MSSQL</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <span className="text-orange-500">✓</span>
                    <span>Natural language to SQL</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <span className="text-orange-500">✓</span>
                    <span>Secure read-only queries</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <span className="text-orange-500">✓</span>
                    <span>AI-generated explanations</span>
                  </div>
                </div>
                <button className="mt-8 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-orange-300">
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
