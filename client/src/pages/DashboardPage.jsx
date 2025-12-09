import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import DataTable from '../components/DataTable';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#f97316', '#fb923c', '#10b981', '#facc15', '#ef4444', '#f472b6', '#14b8a6', '#fbbf24'];

const DashboardPage = ({ connection, onBack }) => {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboards();
  }, [connection.connectionId]);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/dashboards?connectionId=${connection.connectionId}`));
      if (response.ok) {
        const data = await response.json();
        setDashboards(data.dashboards || []);
      }
    } catch (error) {
      console.error('Failed to load dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDashboard = async (dashboardId) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;
    
    try {
      const response = await fetch(getApiUrl(`/api/dashboards/${dashboardId}`), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadDashboards();
        if (selectedDashboard?.id === dashboardId) {
          setSelectedDashboard(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
    }
  };

  const removeInsight = async (dashboardId, insightId) => {
    if (!confirm('Remove this insight from the dashboard?')) return;
    
    try {
      const response = await fetch(getApiUrl(`/api/dashboards/${dashboardId}/insights/${insightId}`), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadDashboards();
        // Refresh selected dashboard
        const updatedDashboard = dashboards.find(d => d.id === dashboardId);
        if (updatedDashboard) {
          const detailResponse = await fetch(getApiUrl(`/api/dashboards/${dashboardId}`));
          const detailData = await detailResponse.json();
          setSelectedDashboard(detailData.dashboard);
        }
      }
    } catch (error) {
      console.error('Failed to remove insight:', error);
    }
  };

  const shareDashboard = async (dashboardId) => {
    try {
      const response = await fetch(getApiUrl(`/api/dashboards/${dashboardId}/share`), {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ Dashboard shared! Copy this link:\n\n${data.shareUrl}`);
      }
    } catch (error) {
      console.error('Failed to share dashboard:', error);
    }
  };

  const exportDashboardPDF = (dashboard) => {
    alert('📄 PDF export coming soon! This will generate a professional report with all insights.');
  };

  const renderChart = (insight) => {
    const chartType = insight.chartType || 'bar';
    const data = insight.results || [];
    
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const numericColumns = columns.filter(col => 
      !isNaN(parseFloat(data[0][col])) && isFinite(data[0][col])
    );
    const xAxis = columns[0];
    const yAxis = numericColumns[0] || columns[1];

    return (
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'bar' && (
          <BarChart data={data.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xAxis} stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              labelStyle={{ color: '#1f2937' }}
            />
            <Legend />
            {numericColumns.map((col, idx) => (
              <Bar key={col} dataKey={col} fill={COLORS[idx % COLORS.length]} />
            ))}
          </BarChart>
        )}

        {chartType === 'line' && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xAxis} stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              labelStyle={{ color: '#1f2937' }}
            />
            <Legend />
            {numericColumns.map((col, idx) => (
              <Line key={col} type="monotone" dataKey={col} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} />
            ))}
          </LineChart>
        )}

        {chartType === 'area' && (
          <AreaChart data={data}>
            <defs>
              {numericColumns.map((col, idx) => (
                <linearGradient key={col} id={`dashColor${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.1}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xAxis} stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              labelStyle={{ color: '#1f2937' }}
            />
            <Legend />
            {numericColumns.map((col, idx) => (
              <Area 
                key={col} 
                type="monotone" 
                dataKey={col} 
                stroke={COLORS[idx % COLORS.length]} 
                fillOpacity={1} 
                fill={`url(#dashColor${idx})`} 
              />
            ))}
          </AreaChart>
        )}

        {chartType === 'pie' && (
          <PieChart>
            <Pie
              data={data.slice(0, 10)}
              dataKey={yAxis}
              nameKey={xAxis}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.slice(0, 10).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboards...</p>
        </div>
      </div>
    );
  }

  if (selectedDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm border border-orange-200 rounded-2xl p-6 mb-6 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedDashboard(null)}
                  className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">{selectedDashboard.name}</h1>
                  <p className="text-gray-600 mt-1">{selectedDashboard.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedDashboard.insights?.length || 0} insights • Last updated {new Date(selectedDashboard.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => shareDashboard(selectedDashboard.id)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all flex items-center gap-2 shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <button
                  onClick={() => exportDashboardPDF(selectedDashboard)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all flex items-center gap-2 shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Insights Grid */}
          {selectedDashboard.insights && selectedDashboard.insights.length > 0 ? (
            <div className="grid gap-6">
              {selectedDashboard.insights.map((insight) => (
                <div key={insight.id} className="bg-white/90 border border-orange-200 rounded-2xl p-6 shadow-md">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{insight.question}</h3>
                      <p className="text-sm text-gray-500">
                        Added {new Date(insight.addedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeInsight(selectedDashboard.id, insight.id)}
                      className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {insight.aiExplanation && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 p-4 mb-4 rounded-xl">
                      <p className="text-sm text-green-700 whitespace-pre-wrap">{insight.aiExplanation}</p>
                    </div>
                  )}

                  {renderChart(insight)}

                  {insight.results && (
                    <div className="mt-4">
                      <DataTable data={insight.results.slice(0, 50)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/90 border border-orange-200 rounded-2xl p-12 text-center shadow-md">
              <svg className="w-16 h-16 text-orange-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h2m-6 0h6" />
              </svg>
              <p className="text-gray-700 text-lg">No insights saved yet</p>
              <p className="text-gray-500 text-sm mt-2">Query your database and save interesting insights here</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border border-orange-200 rounded-2xl p-6 mb-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent mb-2">My Dashboards</h1>
              <p className="text-gray-600">Manage your saved insights and visualizations</p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2 shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Query
            </button>
          </div>
        </div>

        {/* Dashboards Grid */}
        {dashboards.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <div
                key={dashboard.id}
                className="bg-white/90 border border-orange-200 rounded-2xl p-6 hover:border-orange-400 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedDashboard(dashboard)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                        {dashboard.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {dashboard.insights?.length || 0} insights
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDashboard(dashboard.id);
                    }}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{dashboard.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-orange-200">
                  <span>Updated {new Date(dashboard.updatedAt).toLocaleDateString()}</span>
                  <span className="text-orange-600 font-medium">View →</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/90 border border-orange-200 rounded-2xl p-12 text-center shadow-md">
            <svg className="w-16 h-16 text-orange-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h2m-6 0h6" />
            </svg>
            <p className="text-gray-700 text-lg mb-2">No dashboards yet</p>
            <p className="text-gray-500 text-sm">Start querying your database and save insights to dashboards</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
