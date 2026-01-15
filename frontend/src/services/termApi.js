/**
 * Term API service
 */
import api from './api';

/**
 * Get terms for a program
 * @param {string} programId - Program ID
 * @returns {Promise<Object>} Terms response
 */
export const getTerms = async (programId) => {
  const response = await api.get(`/api/admin/programs/${programId}/terms`);
  return response.data;
};

/**
 * Get term by ID
 * @param {string} id - Term ID
 * @returns {Promise<Object>} Term data
 */
export const getTerm = async (id) => {
  const response = await api.get(`/api/admin/terms/${id}`);
  return response.data;
};

/**
 * Create new term
 * @param {string} programId - Program ID
 * @param {Object} termData - Term data
 * @returns {Promise<Object>} Created term
 */
export const createTerm = async (programId, termData) => {
  const response = await api.post(`/api/admin/programs/${programId}/terms`, termData);
  return response.data;
};

/**
 * Update term
 * @param {string} id - Term ID
 * @param {Object} termData - Updated term data
 * @returns {Promise<Object>} Updated term
 */
export const updateTerm = async (id, termData) => {
  const response = await api.put(`/api/admin/terms/${id}`, termData);
  return response.data;
};

/**
 * Delete term
 * @param {string} id - Term ID
 */
export const deleteTerm = async (id) => {
  await api.delete(`/api/admin/terms/${id}`);
};

/**
 * Close term (hide lessons)
 * @param {string} id - Term ID
 * @returns {Promise<Object>} Updated term
 */
export const closeTerm = async (id) => {
  const response = await api.post(`/api/admin/terms/${id}/close`);
  return response.data;
};

/**
 * Open term (show lessons)
 * @param {string} id - Term ID
 * @returns {Promise<Object>} Updated term
 */
export const openTerm = async (id) => {
  const response = await api.post(`/api/admin/terms/${id}/open`);
  return response.data;
};