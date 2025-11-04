import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, TrendingUp, Users, MessageSquare } from 'lucide-react';

function Analytics() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const [dashboardRes, engagementRes] = await Promise.all([
        axios.get('/api/analytics/dashboard'),
        axios.get('/api/analytics/engagement', {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        })
      ]);

      setDashboardStats(dashboardRes.data.data);
      setEngagement(engagementRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/analytics/export', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${dateRange.startDate}-${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error exporting data: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px' }}>
            Analytics
          </h1>
          <p style={{ color: '#666' }}>
            Track performance and engagement metrics
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
          <label>Start Date</label>
          <input
            type="date"
            className="form-control"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
          <label>End Date</label>
          <input
            type="date"
            className="form-control"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Messages</span>
            <div className="stat-card-icon" style={{ backgroundColor: '#eff6ff' }}>
              <MessageSquare size={20} color="#3b82f6" />
            </div>
          </div>
          <div className="stat-card-value">
            {dashboardStats?.totalMessages?.toLocaleString() || 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Delivery Rate</span>
            <div className="stat-card-icon" style={{ backgroundColor: '#f0fdf4' }}>
              <TrendingUp size={20} color="#10b981" />
            </div>
          </div>
          <div className="stat-card-value">
            {dashboardStats?.deliveryRate || 0}%
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Active Customers</span>
            <div className="stat-card-icon" style={{ backgroundColor: '#fef3c7' }}>
              <Users size={20} color="#f59e0b" />
            </div>
          </div>
          <div className="stat-card-value">
            {dashboardStats?.totalCustomers?.toLocaleString() || 0}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="table-container">
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Interactions by Type
          </h2>
          {engagement?.interactionsByType && engagement.interactionsByType.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Interaction Type</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {engagement.interactionsByType.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textTransform: 'capitalize' }}>
                      {item.interaction_type.replace('_', ' ')}
                    </td>
                    <td><strong>{item.count}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              No interaction data available
            </p>
          )}
        </div>

        <div className="table-container">
          <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Engagement by Category
          </h2>
          {engagement?.categoryEngagement && engagement.categoryEngagement.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Customers</th>
                  <th>Interactions</th>
                </tr>
              </thead>
              <tbody>
                {engagement.categoryEngagement.map((item, index) => (
                  <tr key={index}>
                    <td>{item.interest_category}</td>
                    <td>{item.engaged_customers}</td>
                    <td><strong>{item.total_interactions}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              No engagement data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;

