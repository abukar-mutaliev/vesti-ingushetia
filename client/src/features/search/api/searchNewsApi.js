import api from '@app/providers/store/apiClient';
export const fetchNewsByCategory = (categoryId) => {
    return api.get(`/api/news/category/${categoryId}`);
};

export const searchNews = (query) => {
    return api.get(`/api/news/search?keywords=${encodeURIComponent(query)}`);
};
