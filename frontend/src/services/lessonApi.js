/**
 * Lesson API service
 */
import api from './api';

/**
 * Get lessons for a term
 * @param {string} termId - Term ID
 * @returns {Promise<Object>} Lessons response
 */
export const getLessons = async (termId) => {
  const response = await api.get(`/api/admin/terms/${termId}/lessons`);
  return response.data;
};

/**
 * Get lesson by ID
 * @param {string} id - Lesson ID
 * @returns {Promise<Object>} Lesson data
 */
export const getLesson = async (id) => {
  const response = await api.get(`/api/admin/lessons/${id}`);
  return response.data;
};

/**
 * Create new lesson
 * @param {string} termId - Term ID
 * @param {Object} lessonData - Lesson data
 * @returns {Promise<Object>} Created lesson
 */
export const createLesson = async (termId, lessonData) => {
  const response = await api.post(`/api/admin/terms/${termId}/lessons`, lessonData);
  return response.data;
};

/**
 * Update lesson
 * @param {string} id - Lesson ID
 * @param {Object} lessonData - Updated lesson data
 * @returns {Promise<Object>} Updated lesson
 */
export const updateLesson = async (id, lessonData) => {
  const response = await api.put(`/api/admin/lessons/${id}`, lessonData);
  return response.data;
};

/**
 * Delete lesson
 * @param {string} id - Lesson ID
 */
export const deleteLesson = async (id) => {
  await api.delete(`/api/admin/lessons/${id}`);
};

/**
 * Publish lesson
 * @param {string} id - Lesson ID
 * @returns {Promise<Object>} Updated lesson
 */
export const publishLesson = async (id) => {
  const response = await api.post(`/api/admin/lessons/${id}/publish`);
  return response.data;
};

/**
 * Schedule lesson publishing
 * @param {string} id - Lesson ID
 * @param {string} publishAt - ISO date string for when to publish
 * @returns {Promise<Object>} Updated lesson
 */
export const scheduleLesson = async (id, publishAt) => {
  const response = await api.post(`/api/admin/lessons/${id}/schedule`, { publishAt });
  return response.data;
};

/**
 * Archive lesson
 * @param {string} id - Lesson ID
 * @returns {Promise<Object>} Updated lesson
 */
export const archiveLesson = async (id) => {
  const response = await api.post(`/api/admin/lessons/${id}/archive`);
  return response.data;
};

/**
 * Update lesson assets
 * @param {string} id - Lesson ID
 * @param {string} language - Language code
 * @param {string} assetType - Asset type (thumbnail)
 * @param {Object} assets - Asset URLs by variant
 * @returns {Promise<Object>} Update response
 */
export const updateLessonAssets = async (id, language, assetType, assets) => {
  const response = await api.put(`/api/admin/lessons/${id}/assets`, {
    language,
    assetType,
    assets
  });
  return response.data;
};