import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import ChatPage from "./pages/ChatPage";
import ConnectionPage from "./pages/ConnectionPage";
import MongoQueryPage from "./pages/MongoQueryPage";
import SQLConnectionPage from "./pages/SQLConnectionPage";
import SQLQueryPage from "./pages/SQLQueryPage";

function App() {
  const [mode, setMode] = useState('select'); // 'select', 'pdf', 'mongo', 'sql'
  const [uploaded, setUploaded] = useState(false);
  const [connection, setConnection] = useState(null);

  const resetApp = () => {
    setMode('select');
    setUploaded(false);
    setConnection(null);
    localStorage.removeItem('fileId');
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-12">
              <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent">
                DataSpeaks
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                AI-powered platform for intelligent document and database querying. 
                Transform your data into conversations.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* PDF RAG Option */}
              <div 
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer border border-gray-700/50 hover:border-blue-500/50 group" 
                onClick={() => setMode('pdf')}
              >
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">📄</div>
                <h2 className="text-3xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">PDF Q&A</h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Upload PDF documents and engage in natural conversations. 
                  Advanced RAG technology provides contextual answers from your documents.
                </p>
                <div className="text-sm text-blue-400 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span>✓ Upload any PDF document</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>✓ Natural language questions</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>✓ Contextual answers with sources</span>
                  </div>
                </div>
              </div>

              {/* MongoDB Query Option */}
              <div 
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer border border-gray-700/50 hover:border-green-500/50 group" 
                onClick={() => setMode('mongo')}
              >
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🗄️</div>
                <h2 className="text-3xl font-bold mb-4 text-white group-hover:text-green-400 transition-colors">MongoDB Queries</h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Connect to your MongoDB database and query using plain English. 
                  AI converts your questions to optimized MongoDB queries.
                </p>
                <div className="text-sm text-green-400 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span>✓ Connect to any MongoDB</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>✓ Plain English queries</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>✓ See generated queries & results</span>
                  </div>
                </div>
              </div>

              {/* SQL Database Query Option */}
              <div 
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer border border-gray-700/50 hover:border-purple-500/50 group" 
                onClick={() => setMode('sql')}
              >
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">💾</div>
                <h2 className="text-3xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors">SQL Databases</h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Connect to MySQL, PostgreSQL, SQLite, or SQL Server. 
                  Ask questions in natural language and get instant results.
                </p>
                <div className="text-sm text-purple-400 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span>✓ MySQL, PostgreSQL, SQLite, MSSQL</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>✓ Natural language to SQL</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span>✓ Secure read-only queries</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
              <span>🤖 Powered by Google Gemini AI</span>
              <span>•</span>
              <span>🔒 Secure & Private</span>
              <span>•</span>
              <span>⚡ Read-only Operations</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'pdf') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        {/* Header */}
        <header className="relative z-10 p-6">
          <nav className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              PDF Document Q&A
            </h1>
            <button
              onClick={resetApp}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 
                         rounded-xl text-gray-300 hover:text-white transition-all duration-200 
                         backdrop-blur-sm"
            >
              ← Back to Home
            </button>
          </nav>
        </header>
        
        <main className="relative z-10 flex-1 flex items-center justify-center p-6">
          {!uploaded ? (
            <UploadPage onUpload={() => setUploaded(true)} />
          ) : (
            <ChatPage />
          )}
        </main>
      </div>
    );
  }

  if (mode === 'mongo') {
    if (!connection) {
      return <ConnectionPage onConnect={setConnection} />;
    } else {
      return (
        <MongoQueryPage 
          connection={connection} 
          onDisconnect={resetApp} 
        />
      );
    }
  }

  if (mode === 'sql') {
    if (!connection) {
      return <SQLConnectionPage onConnect={setConnection} />;
    } else {
      return (
        <SQLQueryPage 
          connection={connection} 
          onDisconnect={resetApp} 
        />
      );
    }
  }

  return null;
}

export default App;