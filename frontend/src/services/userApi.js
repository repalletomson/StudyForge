/**
 * User management API service
 */
import api from './api';

/**
 * Get all users
 * @returns {Promise<Object>} Users response
 */
export const getUsers = async () => {
  const response = await api.get('/api/admin/users');
  return response.data;
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.role - User role (admin, editor, viewer)
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
  const response = await api.post('/api/admin/users', userData);
  return response.data;
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User data
 */
export const getUser = async (id) => {
  const response = await api.get(`/api/admin/users/${id}`);
  return response.data;
};

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} userData - Updated user data
 * @param {string} [userData.email] - User email
 * @param {string} [userData.role] - User role
 * @param {boolean} [userData.isActive] - User active status
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (id, userData) => {
  const response = await api.put(`/api/admin/users/${id}`, userData);
  return response.data;
};

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {Promise<void>}
 */
export const deleteUser = async (id) => {
  await api.delete(`/api/admin/users/${id}`);
};

/**
 * Reset user password
 * @param {string} id - User ID
 * @param {Object} passwordData - Password data
 * @param {string} passwordData.newPassword - New password
 * @returns {Promise<Object>} Response
 */
export const resetUserPassword = async (id, passwordData) => {
  const response = await api.post(`/api/admin/users/${id}/reset-password`, passwordData);
  return response.data;
};

/**
 * Toggle user active status
 * @param {string} id - User ID
 * @param {boolean} isActive - Active status
 * @returns {Promise<Object>} Updated user
 */
export const toggleUserStatus = async (id, isActive) => {
  const response = await api.patch(`/api/admin/users/${id}/status`, { isActive });
  return response.data;
};