import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiShoppingBag, FiStar, FiTrendingUp, FiEdit, FiTrash2 } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes, storesRes] = await Promise.all([
        axios.get('/admin/dashboard'),
        axios.get('/admin/users'),
        axios.get('/admin/stores')
      ]);

      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setStores(storesRes.data.stores);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/admin/users/${userId}`);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      const response = await axios.put(`/admin/users/${userData.id}`, userData);
      setUsers(users.map(user => 
        user.id === userData.id ? response.data.user : user
      ));
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="tab-navigation">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={activeTab === 'stores' ? 'active' : ''}
            onClick={() => setActiveTab('stores')}
          >
            Stores
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon users">
                <FiUsers />
              </div>
              <div className="stat-info">
                <h3>{stats?.totalUsers || 0}</h3>
                <p>Total Users</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stores">
                <FiShoppingBag />
              </div>
              <div className="stat-info">
                <h3>{stats?.totalStores || 0}</h3>
                <p>Total Stores</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon ratings">
                <FiStar />
              </div>
              <div className="stat-info">
                <h3>{stats?.totalRatings || 0}</h3>
                <p>Total Ratings</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon average">
                <FiTrendingUp />
              </div>
              <div className="stat-info">
                <h3>{stats?.averageRating?.toFixed(1) || '0.0'}</h3>
                <p>Average Rating</p>
              </div>
            </div>
          </div>

          <div className="role-distribution">
            <h3>Users by Role</h3>
            <div className="role-stats">
              {stats?.usersByRole?.map(role => (
                <div key={role.role} className="role-item">
                  <span className="role-name">{role.role}</span>
                  <span className="role-count">{role.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-content">
          <h2>Manage Users</h2>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.address || 'N/A'}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="edit-btn"
                          onClick={() => setEditingUser(user)}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stores' && (
        <div className="stores-content">
          <h2>Manage Stores</h2>
          <div className="stores-grid">
            {stores.map(store => (
              <div key={store.id} className="store-card">
                <h3>{store.name}</h3>
                <p><strong>Email:</strong> {store.email}</p>
                <p><strong>Address:</strong> {store.address || 'N/A'}</p>
                <p><strong>Owner:</strong> {store.User?.name || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleUpdateUser}
          onCancel={() => setEditingUser(null)}
        />
      )}
    </div>
  );
};

const EditUserModal = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    address: user.address || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Edit User</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
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
            <label>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="user">User</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
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
            <button type="submit" className="save-btn">Save</button>
            <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
