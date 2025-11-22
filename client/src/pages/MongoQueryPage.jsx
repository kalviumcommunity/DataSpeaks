import React, { useState, useEffect, useRef, useCallback } from 'react';
import JsonFormatter from './JsonFormatter';
import { getApiUrl } from '../config/api';

function MongoQueryPage({ connection, onDisconnect }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sampleQuestions, setSampleQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  const loadSampleQuestions = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/api/mongo/${connection.connectionId}/samples`));
      const result = await res.json();
      if (result.success) {
        setSampleQuestions(result.questions);
      }
    } catch (error) {
      console.error('Failed to load sample questions:', error);
      // Set some default sample questions if API fails
      setSampleQuestions([
        "How many documents are in each collection?",
        "Show me the first 5 documents from the users collection",
        "What are the unique values in the status field?",
        "Find all documents created in the last 7 days",
        "Show me the document structure for each collection"
      ]);
    }
  }, [connection.connectionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadSampleQuestions();
    
    setMessages([{
      type: 'system',
      content: `Successfully connected to database: ${connection.databaseName}`,
      timestamp: new Date(),
      collections: connection.collections,
    }]);
  }, [connection.connectionId, connection.databaseName, connection.collections, loadSampleQuestions]);

  const askQuestion = async (questionText = question) => {
    if (!questionText.trim()) return;
    
    setLoading(true);
    const userMessage = {
      type: 'user',
      content: questionText.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');

    try {
      const res = await fetch(getApiUrl(`/api/mongo/${connection.connectionId}/query`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText.trim(),
          collections: connection.collections,
        }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        const aiMessage = {
          type: 'ai',
          content: result.resultExplanation || result.explanation || 'Query executed successfully',
          timestamp: new Date(),
          data: {
            mongoQuery: result.mongoQuery,
            mongoShell: result.mongoShell,
            collection: result.collection,
            operation: result.operation,
            result: result.result,
            explanation: result.explanation,
          },
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          type: 'error',
          content: result.error || 'Failed to execute query',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        type: 'error',
        content: 'Network error: ' + error.message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl animate-bounce"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-xl border-b border-gray-700/50 p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
                MongoDB Query Chat
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">Database: <span className="font-mono text-blue-400">{connection.databaseName}</span></span>
                </div>
                <div className="text-sm text-gray-400">
                  Collections: <span className="text-white font-medium">{connection.collections.length}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Connected as: <span className="text-purple-400 font-medium">harishb2006</span>
                </div>
              </div>
            </div>
            <button
              onClick={onDisconnect}
              className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Disconnect
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto w-full flex gap-8 p-8">
          {/* Sidebar */}
          <div className="w-80 bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Collections ({connection.collections.length})</h3>
            </div>
            <div className="space-y-2 mb-8 max-h-40 overflow-y-auto custom-scrollbar">
              {connection.collections.map((col, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/30 border border-gray-700/30 rounded-xl hover:border-gray-600/50 transition-all duration-200">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-300 font-mono">{col.name}</span>
                  {col.count && (
                    <span className="ml-auto text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                      {col.count.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Sample Questions</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {sampleQuestions.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => askQuestion(sample)}
                  disabled={loading}
                  className="w-full text-left text-sm p-3 bg-blue-600/20 hover:bg-blue-500/30 border border-blue-700/30 hover:border-blue-600/50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="text-blue-300 group-hover:text-blue-200">{sample}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-xl mb-2 text-white font-medium">Ready to query your database!</p>
                  <p className="text-sm">Ask questions in natural language or try the sample questions from the sidebar.</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-5xl ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-12 shadow-lg' 
                      : message.type === 'error'
                      ? 'bg-red-900/40 border border-red-700/50 text-red-200 shadow-lg'
                      : message.type === 'system'
                      ? 'bg-emerald-900/40 border border-emerald-700/50 text-emerald-200 shadow-lg'
                      : 'bg-gray-800/60 border border-gray-700/30 text-gray-100 mr-12 shadow-lg backdrop-blur-sm'
                  } p-6 rounded-2xl`}>
                    
                    <div className="max-w-none">
                      {message.type === 'system' && message.collections && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="font-semibold text-lg">{message.content}</span>
                          </div>
                          <div className="bg-emerald-900/20 p-3 rounded-lg border border-emerald-700/30">
                            <p className="text-sm opacity-90 mb-2">
                              <strong>Collections found:</strong>
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {message.collections.map((c, i) => (
                                <span key={i} className="font-mono text-xs bg-emerald-800/30 px-2 py-1 rounded border border-emerald-700/50">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {message.type !== 'system' && (
                        <p className="text-sm leading-relaxed mb-4">{message.content}</p>
                      )}
                      
                      {message.data && (
                        <div className="space-y-4">
                          {/* MongoDB Query Section */}
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-2 p-3 bg-gray-900/30 rounded-lg transition-all duration-200 border border-gray-700/30">
                              <svg className="w-4 h-4 group-open:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                              MongoDB Query Used
                              <div className="ml-auto text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                                {message.data.collection || 'Query'}
                              </div>
                            </summary>
                            <div className="mt-3 bg-gray-950/80 border border-gray-700/30 rounded-xl overflow-hidden">
                              <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700/30">
                                <span className="text-xs text-gray-400 font-medium">MongoDB Shell Command</span>
                              </div>
                              <pre className="p-4 text-sm overflow-x-auto">
                                <code className="text-green-300">{message.data.mongoShell}</code>
                              </pre>
                            </div>
                          </details>
                          
                          {/* Enhanced Results Section with JsonFormatter */}
                          <details className="group" open>
                            <summary className="cursor-pointer text-sm font-medium text-green-400 hover:text-green-300 flex items-center gap-2 p-3 bg-gray-900/30 rounded-lg transition-all duration-200 border border-gray-700/30 mb-4">
                              <svg className="w-4 h-4 group-open:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Query Results
                            </summary>
                            
                            <JsonFormatter 
                              data={message.data.result} 
                              maxHeight="500px" 
                            />
                          </details>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-4 opacity-70 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {message.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-gray-800/60 border border-gray-700/30 text-gray-100 p-5 rounded-2xl mr-12 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                      <span className="text-sm">Processing your query...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-700/50 p-6 bg-gray-900/20 backdrop-blur-sm rounded-b-3xl">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about your database..."
                  className="flex-1 bg-gray-800/50 border-2 border-gray-700/50 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
                  disabled={loading}
                />
                <button
                  onClick={() => askQuestion()}
                  disabled={loading || !question.trim()}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 hover:from-blue-500 hover:via-blue-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="relative flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
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
}

export default MongoQueryPage;