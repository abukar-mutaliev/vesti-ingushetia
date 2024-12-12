import api from '@app/providers/store/apiClient';

const API_URL = `${import.meta.env.VITE_API_URL}/`;

export const fetchVideosApi = () => api.get(`${API_URL}news/videos`);
