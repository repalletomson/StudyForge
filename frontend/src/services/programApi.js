/**
 * Program API service
 */
import api from './api';

/**
 * Get programs with filtering
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Programs response
 */
export const getPrograms = async (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.append(key, value);
    }
  });

  const response = await api.get(`/api/admin/programs?${params.toString()}`);
  return response.data;
};

/**
 * Get program by ID
 * @param {string} id - Program ID
 * @returns {Promise<Object>} Program data
 */
export const getProgram = async (id) => {
  const response = await api.get(`/api/admin/programs/${id}`);
  return response.data;
};

/**
 * Create new program
 * @param {Object} programData - Program data
 * @returns {Promise<Object>} Created program
 */
export const createProgram = async (programData) => {
  const response = await api.post('/api/admin/programs', programData);
  return response.data;
};

/**
 * Update program
 * @param {string} id - Program ID
 * @param {Object} programData - Updated program data
 * @returns {Promise<Object>} Updated program
 */
export const updateProgram = async (id, programData) => {
  const response = await api.put(`/api/admin/programs/${id}`, programData);
  return response.data;
};
export const deleteProgram = async (id) => {
  await api.delete(`/api/admin/programs/${id}`);
};

/**
 * Publish program
 * @param {string} id - Program ID
 * @param {Object} publishData - Publish data (languages)
 * @returns {Promise<Object>} Updated program
 */
export const publishProgram = async (id, publishData) => {
  const response = await api.post(`/api/admin/programs/${id}/publish`, publishData);
  return response.data;
};

/**
 * Schedule program publishing
 * @param {string} id - Program ID
 * @param {Object} scheduleData - Schedule data (scheduledPublishAt, languages)
 * @returns {Promise<Object>} Updated program
 */
export const scheduleProgram = async (id, scheduleData) => {
  const response = await api.post(`/api/admin/programs/${id}/schedule`, scheduleData);
  return response.data;
};

/**
 * Archive program
 * @param {string} id - Program ID
 * @returns {Promise<Object>} Updated program
 */
export const archiveProgram = async (id) => {
  const response = await api.post(`/api/admin/programs/${id}/archive`);
  return response.data;
};

/**
 * Update program assets
 * @param {string} id - Program ID
 * @param {string} language - Language code
 * @param {string} assetType - Asset type (poster)
 * @param {Object} assets - Asset URLs by variant
 * @returns {Promise<Object>} Update response
 */
export const updateProgramAssets = async (id, language, assetType, assets) => {
  const response = await api.put(`/api/admin/programs/${id}/assets`, {
    language,
    assetType,
    assets
  });
  return response.data;
};