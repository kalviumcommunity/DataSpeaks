import React, { useState, useEffect, useRef, useCallback } from 'react';

function MongoQueryPage({ connection, onDisconnect }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sampleQuestions, setSampleQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  const loadSampleQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/mongo/${connection.connectionId}/samples`);
      const result = await res.json();
      if (result.success) {
        setSampleQuestions(result.questions);
      }
    } catch (error) {
      console.error('Failed to load sample questions:', error);
    }
  }, [connection.connectionId]);

  useEffect(() => {
    // Load sample questions on mount
    loadSampleQuestions();
    
    // Add welcome message
    setMessages([{
      type: 'system',
      content: `Connected to database: ${connection.databaseName}`,
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
      const res = await fetch(`/api/mongo/${connection.connectionId}/query`, {
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
          content: result.resultExplanation,
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

  const formatResult = (result) => {
    if (typeof result === 'number') {
      return result.toLocaleString();
    }
    if (Array.isArray(result)) {
      return result.length > 0 ? JSON.stringify(result.slice(0, 5), null, 2) + (result.length > 5 ? '\n... and ' + (result.length - 5) + ' more' : '') : '[]';
    }
    return JSON.stringify(result, null, 2);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">MongoDB Query Chat</h1>
            <p className="text-sm text-gray-400">
              Database: {connection.databaseName} • Collections: {connection.collections.length}
            </p>
          </div>
          <button
            onClick={onDisconnect}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full flex gap-6 p-6">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium mb-3">Collections ({connection.collections.length})</h3>
          <div className="space-y-1 mb-6 max-h-32 overflow-y-auto">
            {connection.collections.map((col, index) => (
              <div key={index} className="text-sm text-gray-300 font-mono bg-gray-700 px-2 py-1 rounded">
                {col.name}
              </div>
            ))}
          </div>

          <h3 className="font-medium mb-3">💡 Sample Questions</h3>
          <div className="space-y-2">
            {sampleQuestions.map((sample, index) => (
              <button
                key={index}
                onClick={() => askQuestion(sample)}
                disabled={loading}
                className="w-full text-left text-sm text-blue-400 hover:text-blue-300 p-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-gray-800 rounded-lg flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-8">
                <p className="text-lg mb-2">🤖 Ready to query your database!</p>
                <p className="text-sm">Ask questions in natural language or try the sample questions.</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-4xl ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white ml-12' 
                    : message.type === 'error'
                    ? 'bg-red-900/50 border border-red-700 text-red-200'
                    : message.type === 'system'
                    ? 'bg-green-900/50 border border-green-700 text-green-200'
                    : 'bg-gray-700 text-gray-100 mr-12'
                } p-4 rounded-lg`}>
                  
                  <div className="prose prose-invert max-w-none">
                    {message.type === 'system' && message.collections && (
                      <div>
                        <p className="font-medium">✅ {message.content}</p>
                        <p className="text-sm mt-2">Collections found: {message.collections.map(c => c.name).join(', ')}</p>
                      </div>
                    )}
                    
                    {message.type !== 'system' && (
                      <p className="text-sm">{message.content}</p>
                    )}
                    
                    {message.data && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <details className="mb-3">
                          <summary className="cursor-pointer text-xs text-blue-400 font-mono hover:text-blue-300">
                            🔍 MongoDB Query Used
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                            <code>{message.data.mongoShell}</code>
                          </pre>
                        </details>
                        
                        <details>
                          <summary className="cursor-pointer text-xs text-green-400 font-mono hover:text-green-300">
                            📊 Raw Results ({Array.isArray(message.data.result) ? message.data.result.length : 1} items)
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            <code>{formatResult(message.data.result)}</code>
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-100 p-4 rounded-lg mr-12">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-sm">Processing query...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your database..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={() => askQuestion()}
                disabled={loading || !question.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MongoQueryPage;
