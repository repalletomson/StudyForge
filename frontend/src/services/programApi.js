import api from './api';

export const getPrograms = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const response = await api.get(`/api/admin/programs?${params.toString()}`);
  return response.data;
};

export const getProgram = async (id) => {
  const response = await api.get(`/api/admin/programs/${id}`);
  return response.data;
};

export const createProgram = async (data) => {
  const response = await api.post('/api/admin/programs', data);
  return response.data;
};

export const updateProgram = async (id, data) => {
  const response = await api.put(`/api/admin/programs/${id}`, data);
  return response.data;
};

export const deleteProgram = async (id) => {
  await api.delete(`/api/admin/programs/${id}`);
};

export const updateProgramAssets = async (id, language, assetType, assets) => {
  const response = await api.put(`/api/admin/programs/${id}/assets`, {
    language,
    assetType,
    assets
  });
  return response.data;
};