// In-memory storage for dashboards (replace with database in production)
let dashboards = [];
let dashboardIdCounter = 1;

/**
 * Create a new dashboard
 */
export const createDashboard = async (req, res) => {
  try {
    const { name, description, connectionId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Dashboard name is required' });
    }

    const dashboard = {
      id: `dashboard_${dashboardIdCounter++}`,
      name,
      description: description || '',
      connectionId,
      insights: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shareToken: null
    };

    dashboards.push(dashboard);
    
    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('❌ Create dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all dashboards
 */
export const getDashboards = async (req, res) => {
  try {
    const { connectionId } = req.query;
    
    let filteredDashboards = dashboards;
    if (connectionId) {
      filteredDashboards = dashboards.filter(d => d.connectionId === connectionId);
    }

    res.json({
      success: true,
      dashboards: filteredDashboards.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      )
    });
  } catch (error) {
    console.error('❌ Get dashboards error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a single dashboard
 */
export const getDashboard = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('❌ Get dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update dashboard
 */
export const updateDashboard = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { name, description } = req.body;
    
    const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId);
    if (dashboardIndex === -1) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    if (name) dashboards[dashboardIndex].name = name;
    if (description !== undefined) dashboards[dashboardIndex].description = description;
    dashboards[dashboardIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      dashboard: dashboards[dashboardIndex]
    });
  } catch (error) {
    console.error('❌ Update dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete dashboard
 */
export const deleteDashboard = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    
    const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId);
    if (dashboardIndex === -1) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    dashboards.splice(dashboardIndex, 1);

    res.json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add insight to dashboard
 */
export const addInsight = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { question, sqlQuery, explanation, results, chartType, aiExplanation } = req.body;
    
    const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId);
    if (dashboardIndex === -1) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const insight = {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question,
      sqlQuery,
      explanation,
      results,
      chartType,
      aiExplanation,
      addedAt: new Date().toISOString()
    };

    dashboards[dashboardIndex].insights.push(insight);
    dashboards[dashboardIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      insight,
      dashboard: dashboards[dashboardIndex]
    });
  } catch (error) {
    console.error('❌ Add insight error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Remove insight from dashboard
 */
export const removeInsight = async (req, res) => {
  try {
    const { dashboardId, insightId } = req.params;
    
    const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId);
    if (dashboardIndex === -1) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const insightIndex = dashboards[dashboardIndex].insights.findIndex(i => i.id === insightId);
    if (insightIndex === -1) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    dashboards[dashboardIndex].insights.splice(insightIndex, 1);
    dashboards[dashboardIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Insight removed successfully',
      dashboard: dashboards[dashboardIndex]
    });
  } catch (error) {
    console.error('❌ Remove insight error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate shareable link for dashboard
 */
export const shareDashboard = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    
    const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId);
    if (dashboardIndex === -1) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    // Generate unique share token
    const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    dashboards[dashboardIndex].shareToken = shareToken;
    dashboards[dashboardIndex].updatedAt = new Date().toISOString();

    const shareUrl = `${req.protocol}://${req.get('host')}/dashboard/shared/${shareToken}`;

    res.json({
      success: true,
      shareToken,
      shareUrl,
      dashboard: dashboards[dashboardIndex]
    });
  } catch (error) {
    console.error('❌ Share dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};
