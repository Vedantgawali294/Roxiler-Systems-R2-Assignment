import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiShoppingBag, FiStar, FiUsers, FiTrendingUp, FiPlus, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeRatings, setStoreRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [showStoreDetails, setShowStoreDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, storesRes] = await Promise.all([
        axios.get('/owner/dashboard'),
        axios.get('/owner/my-stores')
      ]);

      setDashboard(dashboardRes.data.dashboard);
      setStores(storesRes.data.stores);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreRatings = async (storeId) => {
    try {
      const response = await axios.get(`/owner/stores/${storeId}/ratings`);
      setStoreRatings(response.data.ratings);
      setSelectedStore(response.data.store);
      setShowStoreDetails(true);
    } catch (error) {
      console.error('Error fetching store ratings:', error);
    }
  };

  const handleCreateStore = async (storeData) => {
    try {
      await axios.post('/owner/stores', storeData);
      alert('Store created successfully!');
      setShowCreateStore(false);
      fetchData();
    } catch (error) {
      console.error('Error creating store:', error);
      alert(error.response?.data?.message || 'Error creating store');
    }
  };

  const handleDeleteStore = async (storeId, storeName) => {
    if (window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone and will also delete all ratings for this store.`)) {
      try {
        await axios.delete(`/owner/stores/${storeId}`);
        alert('Store deleted successfully!');
        fetchData(); // Refresh the data
      } catch (error) {
        console.error('Error deleting store:', error);
        alert(error.response?.data?.message || 'Error deleting store');
      }
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <FiStar
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = (store) => {
    if (!store.ratingDistribution) return [];
    
    return Object.entries(store.ratingDistribution).map(([stars, count]) => ({
      stars: parseInt(stars),
      count,
      percentage: store.totalRatings > 0 ? (count / store.totalRatings) * 100 : 0
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <h1>Store Owner Dashboard</h1>
        <div className="tab-navigation">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'stores' ? 'active' : ''}
            onClick={() => setActiveTab('stores')}
          >
            My Stores
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && dashboard && (
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stores">
                <FiShoppingBag />
              </div>
              <div className="stat-info">
                <h3>{dashboard.totalStores}</h3>
                <p>Total Stores</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon ratings">
                <FiStar />
              </div>
              <div className="stat-info">
                <h3>{dashboard.totalRatings}</h3>
                <p>Total Ratings</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon average">
                <FiTrendingUp />
              </div>
              <div className="stat-info">
                <h3>{dashboard.overallAverageRating.toFixed(1)}</h3>
                <p>Average Rating</p>
              </div>
            </div>
          </div>

          <div className="recent-ratings">
            <h3>Recent Ratings</h3>
            {dashboard.recentRatings.length === 0 ? (
              <p className="empty-state">No ratings yet</p>
            ) : (
              <div className="ratings-list">
                {dashboard.recentRatings.map((rating, index) => (
                  <div key={index} className="rating-item">
                    <div className="rating-info">
                      <strong>{rating.storeName}</strong>
                      <div className="rating-stars">
                        {renderStars(rating.rating)}
                        <span>{rating.rating}/5</span>
                      </div>
                    </div>
                    <div className="rating-date">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="stores-overview">
            <h3>Stores Overview</h3>
            <div className="stores-summary">
              {dashboard.stores.map(store => (
                <div key={store.id} className="store-summary-card">
                  <h4>{store.name}</h4>
                  <div className="store-stats">
                    <span>{store.totalRatings} ratings</span>
                    <div className="rating-display">
                      {renderStars(store.averageRating)}
                      <span>{store.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stores' && (
        <div className="stores-content">
          <div className="stores-header">
            <h2>My Stores</h2>
            <button
              className="create-store-btn"
              onClick={() => setShowCreateStore(true)}
            >
              <FiPlus /> Create New Store
            </button>
          </div>

          <div className="stores-grid">
            {stores.map(store => (
              <div key={store.id} className="store-card">
                <div className="store-header">
                  <h3>{store.name}</h3>
                  <div className="store-rating">
                    {renderStars(store.averageRating)}
                    <span>{store.averageRating.toFixed(1)} ({store.totalRatings} reviews)</span>
                  </div>
                </div>

                <div className="store-info">
                  <p><strong>Email:</strong> {store.email}</p>
                  <p><strong>Address:</strong> {store.address || 'Not provided'}</p>
                </div>

                <div className="rating-distribution">
                  <h4>Rating Distribution</h4>
                  {getRatingDistribution(store).map(({ stars, count, percentage }) => (
                    <div key={stars} className="rating-bar">
                      <span>{stars}★</span>
                      <div className="bar">
                        <div
                          className="fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>

                <div className="store-actions">
                  <button
                    className="view-ratings-btn"
                    onClick={() => fetchStoreRatings(store.id)}
                  >
                    <FiEye /> View All Ratings
                  </button>
                  <button
                    className="delete-store-btn"
                    onClick={() => handleDeleteStore(store.id, store.name)}
                  >
                    <FiTrash2 /> Delete Store
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateStore && (
        <CreateStoreModal
          onSave={handleCreateStore}
          onCancel={() => setShowCreateStore(false)}
        />
      )}

      {showStoreDetails && selectedStore && (
        <StoreDetailsModal
          store={selectedStore}
          ratings={storeRatings}
          onClose={() => {
            setShowStoreDetails(false);
            setSelectedStore(null);
            setStoreRatings([]);
          }}
        />
      )}
    </div>
  );
};

const CreateStoreModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create New Store</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Store Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="save-btn">Create Store</button>
            <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StoreDetailsModal = ({ store, ratings, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal large">
        <div className="modal-header">
          <h3>{store.name} - Detailed Ratings</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="store-stats">
          <div className="stat">
            <strong>Average Rating:</strong> {store.averageRating}/5
          </div>
          <div className="stat">
            <strong>Total Ratings:</strong> {store.totalRatings}
          </div>
        </div>

        <div className="ratings-details">
          {ratings.length === 0 ? (
            <p className="empty-state">No ratings yet</p>
          ) : (
            ratings.map(rating => (
              <div key={rating.id} className="rating-detail">
                <div className="rating-header">
                  <strong>{rating.User.name}</strong>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FiStar
                        key={star}
                        className={`star ${star <= rating.rating ? 'filled' : ''}`}
                      />
                    ))}
                    <span>{rating.rating}/5</span>
                  </div>
                </div>
                <div className="rating-meta">
                  <span>{rating.User.email}</span>
                  <span>{new Date(rating.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
