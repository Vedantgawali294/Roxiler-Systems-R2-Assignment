import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiUser, FiMail, FiMapPin, FiLock, FiEdit, FiSave, FiX } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: user?.address || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.put('/auth/profile', profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      
      // Update user context if needed
      // You might want to add an updateUser function to your auth context
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error updating profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      await axios.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error changing password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      window.location.href = '/';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#e74c3c';
      case 'owner': return '#3498db';
      case 'user': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <FiUser />
          </div>
          <div className="profile-title">
            <h1>{user?.name}</h1>
            <span 
              className="user-role" 
              style={{ backgroundColor: getRoleColor(user?.role) }}
            >
              {user?.role}
            </span>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-content">
          <div className="profile-section">
            <div className="section-header">
              <h2>Profile Information</h2>
              {!editing ? (
                <button 
                  className="edit-btn"
                  onClick={() => setEditing(true)}
                >
                  <FiEdit /> Edit
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    className="save-btn"
                    onClick={handleProfileUpdate}
                    disabled={loading}
                  >
                    <FiSave /> Save
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setEditing(false);
                      setProfileData({
                        name: user?.name || '',
                        email: user?.email || '',
                        address: user?.address || ''
                      });
                    }}
                  >
                    <FiX /> Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="profile-form">
              <div className="form-group">
                <label>
                  <FiUser /> Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      name: e.target.value
                    })}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="profile-value">{user?.name}</div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <FiMail /> Email Address
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      email: e.target.value
                    })}
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="profile-value">{user?.email}</div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <FiMapPin /> Address
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      address: e.target.value
                    })}
                    placeholder="Enter your address"
                  />
                ) : (
                  <div className="profile-value">
                    {user?.address || 'No address provided'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <h2>Security</h2>
              {!changingPassword ? (
                <button 
                  className="edit-btn"
                  onClick={() => setChangingPassword(true)}
                >
                  <FiLock /> Change Password
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    className="save-btn"
                    onClick={handlePasswordChange}
                    disabled={loading}
                  >
                    <FiSave /> Update Password
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                  >
                    <FiX /> Cancel
                  </button>
                </div>
              )}
            </div>

            {changingPassword && (
              <div className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value
                    })}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value
                    })}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="profile-section">
            <div className="section-header">
              <h2>Account Actions</h2>
            </div>
            <div className="account-actions">
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
