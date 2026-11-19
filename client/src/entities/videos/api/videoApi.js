import api from '@app/providers/store/apiClient';
import { API_BASE_URL } from '@shared/config/apiBase';

const API_URL = API_BASE_URL;

export const fetchVideosApi = () => api.get(`${API_URL}news/videos`);
