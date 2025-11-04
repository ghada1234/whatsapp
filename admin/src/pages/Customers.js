import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, UserPlus, Search, Download } from 'lucide-react';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCustomers();
    fetchCategories();
  }, [filterCategory]);

  const fetchCustomers = async () => {
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('/api/customers', { params });
      setCustomers(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
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

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      setUploadStatus({ type: 'loading', message: 'Uploading...' });
      const response = await axios.post('/api/customers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded ${response.data.stats.success} customers`
      });

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadStatus(null);
        fetchCustomers();
      }, 2000);

    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.error || 'Upload failed'
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers();
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
            Customers
          </h1>
          <p style={{ color: '#666' }}>
            Manage your customer database
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowUploadModal(true)}
        >
          <Upload size={18} />
          Upload CSV
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or WhatsApp number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={18} />
            Search
          </button>
        </form>
        <select
          className="form-control"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.category_name}>
              {cat.category_name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>WhatsApp Number</th>
              <th>Interest Category</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.whatsapp_number}</td>
                <td>{customer.interest_category}</td>
                <td>
                  <span className={`badge badge-${
                    customer.status === 'active' ? 'success' : 'warning'
                  }`}>
                    {customer.status}
                  </span>
                </td>
                <td>{new Date(customer.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            No customers found
          </p>
        )}
      </div>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Customer List</h2>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                &times;
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Upload a CSV file with columns: <strong>name</strong>, <strong>whatsapp_number</strong>, <strong>interest_category</strong>
              </p>
              
              <div className="file-upload">
                <input
                  type="file"
                  id="file-input"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                  <Upload size={40} color="#999" style={{ marginBottom: '10px' }} />
                  <p>{uploadFile ? uploadFile.name : 'Click to select file'}</p>
                  <p style={{ fontSize: '12px', color: '#999' }}>
                    Supported formats: CSV, Excel
                  </p>
                </label>
              </div>

              {uploadStatus && (
                <div className={`alert alert-${uploadStatus.type === 'success' ? 'success' : uploadStatus.type === 'error' ? 'error' : 'info'}`} style={{ marginTop: '15px' }}>
                  {uploadStatus.message}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpload}
                disabled={!uploadFile || uploadStatus?.type === 'loading'}
              >
                {uploadStatus?.type === 'loading' ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;

