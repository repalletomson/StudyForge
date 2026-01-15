/**
 * Authentication API service
 */
import api from './api';

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.firstName - User first name
 * @param {string} userData.lastName - User last name
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @returns {Promise<Object>} Registration response with user data
 */
export const signup = async (userData) => {
  const response = await api.post('/api/auth/signup', userData);
  return response.data;
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Login response with token and user data
 */
export const login = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

/**
 * Logout user
 * @returns {Promise<Object>} Logout response
 */
export const logout = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

/**
 * Get current user information
 * @returns {Promise<Object>} Current user data
 */
export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};