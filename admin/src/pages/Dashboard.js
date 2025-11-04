import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Users, MessageSquare, CheckCircle, Clock } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiClient.get('/api/analytics/dashboard');
      setStats(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: '#3b82f6',
      bgColor: '#eff6ff'
    },
    {
      title: 'Messages Sent',
      value: stats?.totalMessages || 0,
      icon: MessageSquare,
      color: '#25d366',
      bgColor: '#f0fdf4'
    },
    {
      title: 'Delivered',
      value: stats?.messagesDelivered || 0,
      icon: CheckCircle,
      color: '#10b981',
      bgColor: '#ecfdf5'
    },
    {
      title: 'Pending Reminders',
      value: stats?.pendingReminders || 0,
      icon: Clock,
      color: '#f59e0b',
      bgColor: '#fffbeb'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px' }}>
          Dashboard
        </h1>
        <p style={{ color: '#666' }}>
          Welcome to WhatsApp Business API Admin Panel
        </p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">{card.title}</span>
                <div 
                  className="stat-card-icon" 
                  style={{ backgroundColor: card.bgColor }}
                >
                  <Icon size={20} color={card.color} />
                </div>
              </div>
              <div className="stat-card-value">{card.value.toLocaleString()}</div>
              {card.title === 'Messages Sent' && (
                <div className="stat-card-change">
                  {stats?.messagesToday || 0} sent today
                </div>
              )}
              {card.title === 'Delivered' && (
                <div className="stat-card-change">
                  {stats?.deliveryRate || 0}% delivery rate
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="table-container">
        <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
          Recent Activity
        </h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>WhatsApp Number</th>
                <th>Message Type</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivity.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.name}</td>
                  <td>{activity.whatsapp_number}</td>
                  <td>
                    <span style={{ textTransform: 'capitalize' }}>
                      {activity.message_type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${
                      activity.status === 'delivered' || activity.status === 'read' 
                        ? 'success' 
                        : activity.status === 'failed' 
                        ? 'danger' 
                        : 'warning'
                    }`}>
                      {activity.status}
                    </span>
                  </td>
                  <td>{new Date(activity.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

