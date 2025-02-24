import api from '@app/providers/store/apiClient';

const API_URL = `${import.meta.env.VITE_API_URL}/program`;

export const fetchTvProgramsApi = async () => api.get(`${API_URL}/all`);

export const createTvProgramApi = async (programData) =>
    api.post(`${API_URL}/add`, programData);

export const updateTvProgramApi = async (id, program) =>
    api.put(`${API_URL}/update/${id}`, { program });

export const deleteTvProgramApi = async (id) =>
    api.delete(`${API_URL}/delete/${id}`);
