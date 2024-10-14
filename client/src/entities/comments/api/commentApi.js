import api from '@app/providers/store/apiClient';

const API_URL = 'http://localhost:5000/api/comments';

export const createComment = (comment) => api.post(`${API_URL}/add`, comment);

export const getCommentsForNews = (newsId) => api.get(`${API_URL}/${newsId}`);

export const deleteCommentApi = (commentId) =>
    api.delete(`${API_URL}/delete/${commentId}`, {
        withCredentials: true,
    });

export const likeCommentApi = (commentId) =>
    api.post(`${API_URL}/like/${commentId}`, {}, { withCredentials: true });

export const replyToComment = (parentCommentId, reply) =>
    api.post(`${API_URL}/reply/${parentCommentId}`, reply, {
        withCredentials: true,
    });
