import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch, FiStar, FiMapPin, FiMail, FiEdit, FiEye } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import './UserDashboard.css';

const UserDashboard = () => {
  const [stores, setStores] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stores');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [editingRating, setEditingRating] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [storesRes, ratingsRes] = await Promise.all([
        axios.get('/user/stores'),
        axios.get('/user/my-ratings')
      ]);

      setStores(storesRes.data.stores);
      setMyRatings(ratingsRes.data.ratings);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/user/stores?search=${searchTerm}`);
      setStores(response.data.stores);
    } catch (error) {
      console.error('Error searching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    try {
      if (editingRating) {
        await axios.put(`/user/ratings/${editingRating.id}`, {
          rating: ratingValue
        });
        alert('Rating updated successfully!');
      } else {
        await axios.post('/user/ratings', {
          store_id: selectedStore.id,
          rating: ratingValue
        });
        alert('Rating submitted successfully!');
      }
      
      setShowRatingModal(false);
      setEditingRating(null);
      fetchData();
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert(error.response?.data?.message || 'Error submitting rating');
    }
  };

  const openRatingModal = (store, existingRating = null) => {
    setSelectedStore(store);
    setEditingRating(existingRating);
    setRatingValue(existingRating ? existingRating.rating : 5);
    setShowRatingModal(true);
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <FiStar
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>User Dashboard</h1>
        <div className="tab-navigation">
          <button
            className={activeTab === 'stores' ? 'active' : ''}
            onClick={() => setActiveTab('stores')}
          >
            Browse Stores
          </button>
          <button
            className={activeTab === 'ratings' ? 'active' : ''}
            onClick={() => setActiveTab('ratings')}
          >
            My Ratings
          </button>
        </div>
      </div>

      {activeTab === 'stores' && (
        <div className="stores-content">
          <div className="search-section">
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search stores by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="search-btn">
                Search
              </button>
            </div>
          </div>

          <div className="stores-grid">
            {stores.map(store => {
              const userRating = myRatings.find(r => r.Store.id === store.id);
              return (
                <div key={store.id} className="store-card">
                  <div className="store-header">
                    <h3>{store.name}</h3>
                    <div className="store-rating">
                      {renderStars(store.averageRating)}
                      <span className="rating-text">
                        {store.averageRating.toFixed(1)} ({store.totalRatings} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="store-info">
                    <p><FiMail /> {store.email}</p>
                    <p><FiMapPin /> {store.address || 'Address not provided'}</p>
                    <p><strong>Owner:</strong> {store.User?.name || 'N/A'}</p>
                  </div>

                  <div className="store-actions">
                    {userRating ? (
                      <button
                        className="rate-btn edit"
                        onClick={() => openRatingModal(store, userRating)}
                      >
                        <FiEdit /> Edit Rating ({userRating.rating}★)
                      </button>
                    ) : (
                      <button
                        className="rate-btn"
                        onClick={() => openRatingModal(store)}
                      >
                        <FiStar /> Rate Store
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'ratings' && (
        <div className="ratings-content">
          <h2>My Ratings</h2>
          {myRatings.length === 0 ? (
            <div className="empty-state">
              <p>You haven't rated any stores yet.</p>
            </div>
          ) : (
            <div className="ratings-list">
              {myRatings.map(rating => (
                <div key={rating.id} className="rating-card">
                  <div className="rating-header">
                    <h3>{rating.Store.name}</h3>
                    <div className="rating-stars">
                      {renderStars(rating.rating)}
                      <span>{rating.rating}/5</span>
                    </div>
                  </div>
                  <div className="rating-info">
                    <p><FiMapPin /> {rating.Store.address || 'Address not provided'}</p>
                    <p className="rating-date">
                      Rated on {new Date(rating.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    className="edit-rating-btn"
                    onClick={() => openRatingModal(rating.Store, rating)}
                  >
                    <FiEdit /> Edit Rating
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showRatingModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {editingRating ? 'Edit Rating' : 'Rate Store'}: {selectedStore?.name}
            </h3>
            <div className="rating-section">
              <p>Select your rating:</p>
              <div className="interactive-stars">
                {renderStars(ratingValue, true, setRatingValue)}
              </div>
              <p className="rating-text">{ratingValue} out of 5 stars</p>
            </div>
            <div className="modal-actions">
              <button onClick={handleSubmitRating} className="submit-btn">
                {editingRating ? 'Update Rating' : 'Submit Rating'}
              </button>
              <button 
                onClick={() => {
                  setShowRatingModal(false);
                  setEditingRating(null);
                }} 
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
