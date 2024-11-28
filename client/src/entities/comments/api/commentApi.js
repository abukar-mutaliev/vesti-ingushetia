import api from '@app/providers/store/apiClient';

const API_URL = 'http://localhost:5000/api/comments';

export const createCommentApi = (comment) =>
    api.post(`${API_URL}/add`, comment);

export const getCommentsForNewsApi = (newsId) =>
    api.get(`${API_URL}/${newsId}`);

export const getAllCommentsApi = (newsId) => api.get(`${API_URL}/all`);

export const deleteCommentApi = (commentId) =>
    api.delete(`${API_URL}/delete/${commentId}`);

export const likeCommentApi = (commentId) =>
    api.post(`${API_URL}/like/${commentId}`, {});

export const replyToCommentApi = (parentCommentId, reply) =>
    api.post(`${API_URL}/reply/${parentCommentId}`, reply, {});
