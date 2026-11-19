import api from '@app/providers/store/apiClient';
import { API_BASE_URL } from '@shared/config/apiBase';

const API_URL = `${API_BASE_URL}/scheduled-news`;

// Получить мои отложенные новости
export const fetchMyScheduledNewsApi = () => api.get(`${API_URL}/my`);

// Получить все отложенные новости (только админы)
export const fetchAllScheduledNewsApi = () => api.get(`${API_URL}/all`);

// Отменить отложенную новость
export const cancelScheduledNewsApi = (id) => api.delete(`${API_URL}/${id}`);

// Опубликовать отложенную новость немедленно
export const publishScheduledNewsNowApi = (id) => api.post(`${API_URL}/${id}/publish-now`);

// Статистика планировщика (только админы)
export const getScheduledNewsStatsApi = () => api.get(`${API_URL}/stats`);

// Создать отложенную новость (используем существующий endpoint с дополнительными параметрами)
export const createScheduledNewsApi = (newsData) => {
    // Добавляем параметр scheduleForLater для отложенной публикации
    newsData.append('scheduleForLater', 'true');
    return api.post(`${API_BASE_URL}/news/add`, newsData);
}; 