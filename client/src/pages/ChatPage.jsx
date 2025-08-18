import React, { useState, useRef, useEffect } from 'react';

function ChatPage() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [question]);

  const askQuestion = async () => {
    if (!question.trim()) return;
    
    const fileId = localStorage.getItem('fileId');
    if (!fileId) {
      // Better error handling with toast-like notification
      showNotification('No PDF uploaded. Please upload a file first.', 'error');
      return;
    }

    setLoading(true);
    setIsTyping(true);
    const userMessage = { 
      type: 'user', 
      content: question.trim(), 
      timestamp: new Date().toISOString() 
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentQuestion = question.trim();
    setQuestion('');
    
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, question: currentQuestion })
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        setIsTyping(false);
        const aiMessage = { 
          type: 'ai', 
          content: data.answer,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }, 1000);
      
    } catch (error) {
      console.error('Query failed:', error);
      setIsTyping(false);
      const errorMessage = { 
        type: 'error', 
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      showNotification('Failed to get response from AI', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
      type === 'error' 
        ? 'bg-red-500/90 text-white border border-red-400' 
        : 'bg-green-500/90 text-white border border-green-400'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const clearChat = () => {
    setMessages([]);
    showNotification('Chat cleared successfully', 'success');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const suggestedQuestions = [
    "What is the main topic of this document?",
    "Can you summarize the key points?",
    "What are the important dates mentioned?",
    "Who are the main people or organizations discussed?"
  ];

  const handleSuggestedQuestion = (suggestedQ) => {
    setQuestion(suggestedQ);
  };

  return (
    <div className="max-w-5xl mx-auto bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 
                    rounded-3xl shadow-2xl border border-gray-800/50 backdrop-blur-xl overflow-hidden">
      
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Document Assistant</h2>
              <p className="text-blue-100/80 text-sm">Ask anything about your PDF document</p>
            </div>
          </div>
          
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white 
                         transition-all duration-200 backdrop-blur-sm flex items-center space-x-2
                         border border-white/20 hover:border-white/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-900/50 to-black/50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                            rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-300 text-xl font-medium mb-3">Ready to help!</p>
            <p className="text-gray-500 mb-8">Ask any question about your uploaded PDF document</p>
            
            {/* Suggested Questions */}
            <div className="max-w-2xl mx-auto">
              <p className="text-gray-400 text-sm mb-4">Try asking:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((sq, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(sq)}
                    className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl text-left 
                               text-gray-300 text-sm transition-all duration-200 border 
                               border-gray-700/30 hover:border-gray-600/50 backdrop-blur-sm"
                  >
                    "{sq}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
            <div className={`flex items-start space-x-3 max-w-lg lg:max-w-2xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                  : message.type === 'error'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700'
              }`}>
                {message.type === 'user' ? (
                  <span className="text-white font-semibold text-sm">H</span>
                ) : message.type === 'error' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
              </div>
              
              {/* Message Bubble */}
              <div className="flex flex-col space-y-1">
                <div className={`px-5 py-4 rounded-2xl shadow-lg backdrop-blur-sm ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : message.type === 'error'
                    ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-200 border border-red-500/30'
                    : 'bg-gray-800/80 text-gray-200 border border-gray-700/50'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className={`text-xs text-gray-500 px-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {(loading || isTyping) && (
          <div className="flex justify-start mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full 
                              flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="bg-gray-800/80 text-gray-200 px-5 py-4 rounded-2xl shadow-lg 
                              border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm">AI is analyzing your document...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Enhanced Input Area */}
      <div className="border-t border-gray-800/50 p-6 bg-gray-900/30 backdrop-blur-sm">
        <div className="flex space-x-4 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your PDF..."
              rows={1}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl px-5 py-4 
                         text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                         focus:ring-blue-500/50 focus:border-blue-500/50 resize-none
                         backdrop-blur-sm transition-all duration-200 text-sm"
              disabled={loading}
              style={{minHeight: '52px', maxHeight: '120px'}}
            />
            <div className="absolute bottom-2 right-3 text-xs text-gray-500">
              {loading ? 'Sending...' : 'Enter to send'}
            </div>
          </div>
          
          <button
            onClick={askQuestion}
            disabled={loading || !question.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-2xl 
                       hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 
                       disabled:to-gray-700 disabled:cursor-not-allowed transition-all 
                       duration-200 transform hover:scale-105 shadow-lg flex-shrink-0
                       disabled:transform-none disabled:shadow-md"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.8);
        }
      `}</style>
    </div>
  );
}

export default ChatPage;