import { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../config/api';
import DataTable from '../components/DataTable';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SQLQueryPage = ({ connection, onDisconnect, onViewDashboards }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sampleQuestions, setSampleQuestions] = useState([]);
  const [chartTypes, setChartTypes] = useState({}); // Store selected chart type per message
  const [dashboards, setDashboards] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savingInsight, setSavingInsight] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const exportToCSV = (data, filename = 'data-export') => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape commas and quotes
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load dashboards
  useEffect(() => {
    loadDashboards();
  }, [connection.connectionId]);

  const loadDashboards = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/dashboards?connectionId=${connection.connectionId}`));
      if (response.ok) {
        const data = await response.json();
        setDashboards(data.dashboards || []);
      }
    } catch (error) {
      console.error('Failed to load dashboards:', error);
    }
  };

  const saveInsightToDashboard = async (dashboardId, insight) => {
    try {
      const response = await fetch(getApiUrl(`/api/dashboards/${dashboardId}/insights`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insight),
      });

      if (response.ok) {
        setShowSaveModal(false);
        setSavingInsight(null);
        // Show success message
        alert('✅ Insight saved to dashboard successfully!');
      } else {
        alert('❌ Failed to save insight');
      }
    } catch (error) {
      console.error('Failed to save insight:', error);
      alert('❌ Failed to save insight');
    }
  };

  const createAndSaveToDashboard = async (name, insight) => {
    try {
      // Create new dashboard
      const createResponse = await fetch(getApiUrl('/api/dashboards'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: `Created from query: "${insight.question}"`,
          connectionId: connection.connectionId
        }),
      });

      if (createResponse.ok) {
        const createData = await createResponse.json();
        await loadDashboards();
        await saveInsightToDashboard(createData.dashboard.id, insight);
      } else {
        alert('❌ Failed to create dashboard');
      }
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      alert('❌ Failed to create dashboard');
    }
  };

  useEffect(() => {
    // Add welcome message with friendly tone
    const welcomeMessage = {
      id: Date.now(),
      type: 'system',
      content: `✨ Welcome! I'm your data analyst assistant. I'm connected to your ${connection.databaseType.toUpperCase()} database "${connection.databaseName}".`,
      timestamp: new Date().toISOString(),
      metadata: {
        databaseType: connection.databaseType,
        tableCount: connection.tables?.length || 0,
        tables: connection.tables?.map(t => t.name) || []
      },
      helpText: [
        "💬 Ask me questions in plain English - no SQL knowledge needed!",
        "📊 I'll automatically create visualizations for your data",
        "🔍 Try questions like: 'Show me top 10 customers' or 'What's the total sales?'",
        "💡 I can count, sum, average, find patterns, and more!"
      ]
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

  // Auto-detect best chart type based on data
  const detectChartType = (data) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const keys = Object.keys(data[0]);
    const numericColumns = keys.filter(key => {
      const values = data.map(row => row[key]);
      return values.some(v => typeof v === 'number' || !isNaN(parseFloat(v)));
    });

    const categoricalColumns = keys.filter(key => !numericColumns.includes(key));

    // Decision logic for chart type
    if (data.length <= 10 && numericColumns.length > 0 && categoricalColumns.length > 0) {
      // Few rows with categories and numbers -> Pie or Bar
      return numericColumns.length === 1 ? 'pie' : 'bar';
    } else if (numericColumns.length >= 2) {
      // Multiple numeric columns -> Line or Area for trends
      const hasDateOrTime = keys.some(k => 
        k.toLowerCase().includes('date') || 
        k.toLowerCase().includes('time') ||
        k.toLowerCase().includes('year') ||
        k.toLowerCase().includes('month')
      );
      return hasDateOrTime ? 'line' : 'scatter';
    } else if (numericColumns.length === 1 && data.length > 10) {
      // Single numeric with many rows -> Bar chart
      return 'bar';
    }

    return 'bar'; // Default
  };

  // Prepare data for charts
  const prepareChartData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const keys = Object.keys(data[0]);
    const numericColumns = keys.filter(key => {
      const values = data.map(row => row[key]);
      return values.some(v => typeof v === 'number' || !isNaN(parseFloat(v)));
    });

    const categoricalColumns = keys.filter(key => !numericColumns.includes(key));

    return {
      data: data.map(row => {
        const converted = { ...row };
        numericColumns.forEach(col => {
          if (converted[col] !== null && converted[col] !== undefined) {
            converted[col] = parseFloat(converted[col]) || 0;
          }
        });
        return converted;
      }),
      numericColumns,
      categoricalColumns,
      xAxis: categoricalColumns[0] || numericColumns[0] || keys[0],
      yAxis: numericColumns[0] || keys[1] || keys[0]
    };
  };

  const COLORS = ['#f97316', '#fb923c', '#10b981', '#facc15', '#ef4444', '#f472b6', '#14b8a6', '#fbbf24'];

  const renderChart = (message) => {
    if (!message.results || !Array.isArray(message.results) || message.results.length === 0) {
      return null;
    }

    const chartData = prepareChartData(message.results);
    if (!chartData) return null;

    const currentChartType = chartTypes[message.id] || detectChartType(message.results);
    const availableChartTypes = ['bar', 'line', 'area', 'pie', 'scatter'];

    const changeChartType = (newType) => {
      setChartTypes(prev => ({ ...prev, [message.id]: newType }));
    };

    return (
      <div className="mt-4 bg-orange-50/50 border border-orange-200 rounded-lg p-4">
        {/* Chart Type Selector */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Visualization:</span>
            <span className="text-xs text-gray-500">(Auto: {detectChartType(message.results)})</span>
          </div>
          <div className="flex gap-2">
            {availableChartTypes.map(type => (
              <button
                key={type}
                onClick={() => changeChartType(type)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all capitalize ${
                  currentChartType === type
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-orange-50 border border-orange-200'
                }`}
                title={`Switch to ${type} chart`}
              >
                {type === 'bar' && '📊'}
                {type === 'line' && '📈'}
                {type === 'area' && '📉'}
                {type === 'pie' && '🥧'}
                {type === 'scatter' && '⚫'}
                {' '}{type}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Rendering */}
        <ResponsiveContainer width="100%" height={350}>
          {currentChartType === 'bar' && (
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={chartData.xAxis} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#1f2937' }}
              />
              <Legend />
              {chartData.numericColumns.map((col, idx) => (
                <Bar key={col} dataKey={col} fill={COLORS[idx % COLORS.length]} />
              ))}
            </BarChart>
          )}

          {currentChartType === 'line' && (
            <LineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={chartData.xAxis} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#1f2937' }}
              />
              <Legend />
              {chartData.numericColumns.map((col, idx) => (
                <Line key={col} type="monotone" dataKey={col} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} />
              ))}
            </LineChart>
          )}

          {currentChartType === 'area' && (
            <AreaChart data={chartData.data}>
              <defs>
                {chartData.numericColumns.map((col, idx) => (
                  <linearGradient key={col} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.1}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={chartData.xAxis} stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              {chartData.numericColumns.map((col, idx) => (
                <Area 
                  key={col} 
                  type="monotone" 
                  dataKey={col} 
                  stroke={COLORS[idx % COLORS.length]} 
                  fillOpacity={1} 
                  fill={`url(#color${idx})`} 
                />
              ))}
            </AreaChart>
          )}

          {currentChartType === 'pie' && chartData.numericColumns.length > 0 && (
            <PieChart>
              <Pie
                data={chartData.data.slice(0, 10)} // Limit pie chart to 10 slices
                dataKey={chartData.yAxis}
                nameKey={chartData.xAxis}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry[chartData.xAxis]}: ${entry[chartData.yAxis]}`}
              >
                {chartData.data.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
            </PieChart>
          )}

          {currentChartType === 'scatter' && chartData.numericColumns.length >= 2 && (
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={chartData.numericColumns[0]} stroke="#9ca3af" name={chartData.numericColumns[0]} />
              <YAxis dataKey={chartData.numericColumns[1]} stroke="#9ca3af" name={chartData.numericColumns[1]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Legend />
              <Scatter name="Data Points" data={chartData.data} fill="#8b5cf6" />
            </ScatterChart>
          )}
        </ResponsiveContainer>

        <div className="mt-3 text-xs text-gray-500">
          💡 Tip: Switch between chart types using the buttons above. Auto-detected: {detectChartType(message.results)}
        </div>
      </div>
    );
  };

  const formatTableData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    return (
      <div className="mt-4">
        <DataTable 
          data={data} 
          onExport={(filteredData) => exportToCSV(filteredData, 'query-results')} 
        />
      </div>
    );
  };

  const renderMessage = (message) => {
    if (message.type === 'system') {
      return (
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-l-4 border-orange-400 p-6 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-medium text-lg mb-3">{message.content}</p>
              
              {message.helpText && (
                <div className="space-y-2 mt-4">
                  {message.helpText.map((tip, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                      <span className="flex-shrink-0">{tip}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {message.metadata?.tables && message.metadata.tables.length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-700 font-medium mb-2">
                    📋 Your database has {message.metadata.tableCount} table{message.metadata.tableCount !== 1 ? 's' : ''}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.metadata.tables.map((table, idx) => (
                      <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {table}
                      </span>
                    ))}
                  </div>
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
          <div className="max-w-3xl bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-2xl shadow-md">
            <p>{message.content}</p>
          </div>
        </div>
      );
    }

    // Bot message
    return (
      <div className="flex">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0 shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1 max-w-4xl">
          <div className="bg-white/90 border border-orange-100 rounded-2xl p-5 backdrop-blur-sm shadow-md">
            {message.error ? (
              <div className="text-red-600">
                <p className="font-medium mb-2">❌ Oops! Something went wrong:</p>
                <p className="text-sm bg-red-50 p-3 rounded border border-red-200">{message.error}</p>
                <p className="text-xs text-gray-500 mt-3">💡 Try rephrasing your question or check your database connection</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between space-x-2 mb-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-gray-800 font-medium">Got your answer!</p>
                      {message.rowCount !== undefined && (
                        <p className="text-sm text-gray-600 mt-1">
                          Found {message.rowCount} result{message.rowCount !== 1 ? 's' : ''} in your database
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSavingInsight({
                        question: messages.find(m => m.type === 'user' && m.id < message.id)?.content || 'Unnamed query',
                        sqlQuery: message.sqlQuery,
                        explanation: message.explanation,
                        results: message.results,
                        chartType: chartTypes[message.id] || detectChartType(message.results),
                        aiExplanation: message.aiExplanation
                      });
                      setShowSaveModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium shadow-lg flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Save to Dashboard
                  </button>
                </div>
                
                {message.explanation && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-500 text-lg">💡</span>
                      <div>
                        <p className="text-sm font-medium text-blue-700 mb-1">How I understood your question:</p>
                        <p className="text-sm text-blue-600">{message.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {message.sqlQuery && (
                  <details className="bg-gray-50 border border-gray-300 rounded-lg mb-4 group">
                    <summary className="cursor-pointer p-3 hover:bg-gray-100 transition-colors rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          🔍 Technical Details (SQL Query)
                        </span>
                        <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                      </div>
                    </summary>
                    <div className="p-3 pt-0">
                      <code className="text-xs text-gray-700 font-mono block whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                        {message.sqlQuery}
                      </code>
                    </div>
                  </details>
                )}

                {message.results && (
                  <>
                    {renderChart(message)}
                    {formatTableData(message.results)}
                  </>
                )}

                {message.aiExplanation && (
                  <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border border-green-300 p-5 mt-4 rounded-xl shadow-md">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white text-xl">💡</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <span>Insights & Analysis</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">AI-Powered</span>
                        </p>
                        <div className="prose prose-sm max-w-none">
                          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {message.aiExplanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-orange-100">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col p-4 bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border border-orange-200 rounded-2xl p-4 mb-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">💾</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">SQL Query Assistant</h1>
              <p className="text-sm text-gray-600">
                {connection.databaseType.toUpperCase()} • {connection.databaseName} • {connection.tables?.length || 0} tables
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onViewDashboards}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg transition-all flex items-center gap-2 border border-orange-400 shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium">My Dashboards</span>
              {dashboards.length > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {dashboards.length}
                </span>
              )}
            </button>
            <button
              onClick={onDisconnect}
              className="px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-2 border border-gray-300 hover:border-red-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-6xl mx-auto w-full flex flex-col">
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 overflow-hidden flex flex-col shadow-lg">
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
            <div className="border-t border-gray-700 p-5 bg-gradient-to-r from-gray-800/40 to-gray-900/40">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-lg">💭</span>
                <h3 className="text-sm font-medium text-gray-700">Try these questions to get started:</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sampleQuestions.slice(0, 6).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => askQuestion(question)}
                    className="px-4 py-3 text-sm bg-white border border-orange-200 hover:border-orange-400 hover:shadow-md rounded-xl transition-all text-left text-gray-700 hover:text-orange-600 group"
                  >
                    <span className="group-hover:ml-1 transition-all">"{question}"</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                💡 Or type your own question below in plain English
              </p>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-orange-200 p-5 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about your data... (e.g., 'Show top 10 customers' or 'What's the total revenue?')"
                    className="w-full px-5 py-4 bg-white border border-orange-200 rounded-xl text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    disabled={isLoading}
                  />
                  {!inputMessage && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                      Press Enter ↵
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg hover:shadow-orange-300"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Ask</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <span>🤖</span>
                    <span>AI-powered analysis</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>📊</span>
                    <span>Auto visualizations</span>
                  </span>
                </div>
                <span className="text-gray-600">No SQL knowledge required</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Save to Dashboard Modal */}
      {showSaveModal && savingInsight && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-orange-200 max-w-lg w-full shadow-2xl">
            <div className="p-6 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <span>📊</span>
                  <span>Save to Dashboard</span>
                </h3>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSavingInsight(null);
                  }}
                  className="text-gray-400 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Saving insight:</p>
                <p className="text-gray-800 bg-orange-50 p-3 rounded-lg border border-orange-200">"{savingInsight.question}"</p>
              </div>

              {dashboards.length > 0 ? (
                <>
                  <p className="text-sm text-gray-700 mb-3">Select a dashboard:</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                    {dashboards.map((dashboard) => (
                      <button
                        key={dashboard.id}
                        onClick={() => saveInsightToDashboard(dashboard.id, savingInsight)}
                        className="w-full p-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-purple-500/50 rounded-lg transition-all text-left group"
                      >
                        <p className="text-white font-medium group-hover:text-purple-300 transition-colors">
                          {dashboard.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {dashboard.insights?.length || 0} insights • Updated {new Date(dashboard.updatedAt).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-600 mb-4">No dashboards yet. Create one below!</p>
              )}

              <div className="pt-4 border-t border-orange-200">
                <p className="text-sm text-gray-700 mb-3">Or create a new dashboard:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Dashboard name..."
                    id="newDashboardName"
                    className="flex-1 px-4 py-2 bg-white border border-orange-200 rounded-lg text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  />
                  <button
                    onClick={() => {
                      const name = document.getElementById('newDashboardName').value;
                      if (name.trim()) {
                        createAndSaveToDashboard(name, savingInsight);
                      }
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg transition-all font-medium shadow-md"
                  >
                    Create & Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SQLQueryPage;