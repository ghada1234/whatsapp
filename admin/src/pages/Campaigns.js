import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Play, XCircle, BarChart } from 'lucide-react';

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    target_category: '',
    template_id: null
  });

  useEffect(() => {
    fetchCampaigns();
    fetchCategories();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/campaigns');
      setCampaigns(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/campaigns', {
        ...newCampaign,
        template_id: 1 // Default template, should be dynamic
      });

      alert('Campaign created successfully!');
      setShowCreateModal(false);
      setNewCampaign({
        campaign_name: '',
        target_category: '',
        template_id: null
      });
      fetchCampaigns();

    } catch (error) {
      alert('Error creating campaign: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleStartCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to start this campaign? Messages will be sent to all target customers.')) {
      return;
    }

    try {
      await axios.post(`/api/campaigns/${campaignId}/start`);
      alert('Campaign started! Messages are being sent.');
      fetchCampaigns();
    } catch (error) {
      alert('Error starting campaign: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancelCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to cancel this campaign?')) {
      return;
    }

    try {
      await axios.post(`/api/campaigns/${campaignId}/cancel`);
      alert('Campaign cancelled');
      fetchCampaigns();
    } catch (error) {
      alert('Error cancelling campaign: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'running':
        return 'badge-info';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-warning';
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
            Campaigns
          </h1>
          <p style={{ color: '#666' }}>
            Create and manage marketing campaigns
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Target Category</th>
              <th>Recipients</th>
              <th>Sent</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>
                  <strong>{campaign.campaign_name}</strong>
                </td>
                <td>{campaign.target_category || 'All'}</td>
                <td>{campaign.total_recipients}</td>
                <td>{campaign.messages_sent || 0}</td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </td>
                <td>{new Date(campaign.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleStartCampaign(campaign.id)}
                      >
                        <Play size={14} />
                      </button>
                    )}
                    {campaign.status === 'running' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleCancelCampaign(campaign.id)}
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {campaigns.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            No campaigns yet. Create your first campaign!
          </p>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Campaign</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateCampaign}>
              <div className="form-group">
                <label>Campaign Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCampaign.campaign_name}
                  onChange={(e) => setNewCampaign({...newCampaign, campaign_name: e.target.value})}
                  required
                  placeholder="e.g., Diwali Sale 2025"
                />
              </div>

              <div className="form-group">
                <label>Target Category</label>
                <select
                  className="form-control"
                  value={newCampaign.target_category}
                  onChange={(e) => setNewCampaign({...newCampaign, target_category: e.target.value})}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.category_name}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Leave empty to send to all customers
                </small>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Campaigns;

