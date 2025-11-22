import { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../config/api';

const SQLQueryPage = ({ connection, onDisconnect }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sampleQuestions, setSampleQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage = {
      id: Date.now(),
      type: 'system',
      content: `Connected to ${connection.databaseType.toUpperCase()} database "${connection.databaseName}"! You can now ask questions about your data in natural language.`,
      timestamp: new Date().toISOString(),
      metadata: {
        databaseType: connection.databaseType,
        tableCount: connection.tables?.length || 0,
        tables: connection.tables?.map(t => t.name) || []
      }
    };
    setMessages([welcomeMessage]);

    // Load sample questions
    const loadQuestions = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/sql/${connection.connectionId}/sample-questions`));
        if (response.ok) {
          const data = await response.json();
          setSampleQuestions(data.questions || []);
        }
      } catch (error) {
        console.error('Failed to load sample questions:', error);
      }
    };
    
    loadQuestions();
  }, [connection.connectionId, connection.databaseType, connection.databaseName, connection.tables]);

  const askQuestion = async (question) => {
    if (!question.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl(`/api/sql/${connection.connectionId}/query`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          tables: connection.tables,
          schema: connection.schema,
        }),
      });

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.success ? 'Query executed successfully!' : 'Query execution failed.',
        timestamp: new Date().toISOString(),
        sqlQuery: data.sqlQuery,
        explanation: data.explanation,
        results: data.success ? data.results : null,
        rowCount: data.rowCount,
        error: data.success ? null : data.error || data.details,
        aiExplanation: data.aiExplanation,
        metadata: data.metadata || {},
        databaseType: connection.databaseType
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Failed to execute query.',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askQuestion(inputMessage);
  };

  const formatTableData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const headers = Object.keys(data[0]);
    const maxRows = 50; // Limit displayed rows
    const displayData = data.slice(0, maxRows);

    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">
            Results ({data.length} row{data.length !== 1 ? 's' : ''})
          </span>
          {data.length > maxRows && (
            <span className="text-sm text-yellow-400">
              Showing first {maxRows} rows
            </span>
          )}
        </div>
        <div className="overflow-x-auto border border-gray-600 rounded-lg">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700/50">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-gray-800/30 divide-y divide-gray-600">
              {displayData.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-700/20'}>
                  {headers.map((header, colIndex) => (
                    <td key={colIndex} className="px-4 py-2 text-sm text-gray-300 max-w-xs truncate">
                      {row[header] === null ? (
                        <span className="text-gray-500 italic">NULL</span>
                      ) : (
                        String(row[header])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMessage = (message) => {
    if (message.type === 'system') {
      return (
        <div className="bg-purple-500/20 border-l-4 border-purple-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-purple-200 font-medium">{message.content}</p>
              {message.metadata?.tables && message.metadata.tables.length > 0 && (
                <div className="mt-2 text-sm text-purple-300">
                  <strong>Available tables:</strong> {message.metadata.tables.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (message.type === 'user') {
      return (
        <div className="flex justify-end">
          <div className="max-w-3xl bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-2xl">
            <p>{message.content}</p>
          </div>
        </div>
      );
    }

    // Bot message
    return (
      <div className="flex">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 mt-1">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 max-w-4xl">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 backdrop-blur-sm">
            {message.error ? (
              <div className="text-red-400">
                <p className="font-medium">Error: {message.content}</p>
                <p className="text-sm mt-1">{message.error}</p>
              </div>
            ) : (
              <>
                <p className="text-white mb-3">{message.content}</p>
                
                {message.explanation && (
                  <div className="bg-blue-500/20 border-l-4 border-blue-400 p-3 mb-3 rounded-r">
                    <p className="text-sm text-blue-200">
                      <strong>Query Logic:</strong> {message.explanation}
                    </p>
                  </div>
                )}

                {message.sqlQuery && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400 uppercase">
                        {message.databaseType?.toUpperCase()} Query
                      </span>
                      <span className="text-xs text-gray-400">
                        {message.rowCount !== undefined && `${message.rowCount} row${message.rowCount !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <code className="text-sm text-gray-200 font-mono block whitespace-pre-wrap">
                      {message.sqlQuery}
                    </code>
                  </div>
                )}

                {message.results && formatTableData(message.results)}

                {message.aiExplanation && (
                  <div className="bg-green-500/20 border-l-4 border-green-400 p-3 mt-3 rounded-r">
                    <p className="text-sm text-green-200">
                      <strong>Results Summary:</strong> {message.aiExplanation}
                    </p>
                  </div>
                )}
              </>
            )}
            
            <div className="text-xs text-gray-500 mt-3">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 mb-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💾</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">SQL Query Assistant</h1>
              <p className="text-sm text-gray-400">
                {connection.databaseType.toUpperCase()} • {connection.databaseName} • {connection.tables?.length || 0} tables
              </p>
            </div>
          </div>
          <button
            onClick={onDisconnect}
            className="px-4 py-2 text-gray-300 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all flex items-center gap-2 border border-gray-600 hover:border-red-500/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Disconnect
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-6xl mx-auto w-full flex flex-col">
        <div className="flex-1 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id}>
                {renderMessage(message)}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-gray-300">Analyzing your question and querying the database...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sample Questions */}
          {sampleQuestions.length > 0 && messages.length === 1 && (
            <div className="border-t border-gray-700 p-4 bg-gray-800/20">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Try asking:</h3>
              <div className="flex flex-wrap gap-2">
                {sampleQuestions.slice(0, 6).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => askQuestion(question)}
                    className="px-3 py-1.5 text-sm bg-gray-700/50 border border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/20 rounded-full transition-all text-gray-300 hover:text-purple-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-700 p-4 bg-gray-800/30">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask a question about your data..."
                className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLQueryPage;