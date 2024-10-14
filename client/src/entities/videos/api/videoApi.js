import api from '@app/providers/store/apiClient';

const API_URL = 'http://localhost:5000/api/';

export const fetchVideosApi = () => api.get(`${API_URL}news/videos`);
