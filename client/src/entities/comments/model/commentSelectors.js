import { createSelector } from 'reselect';

export const selectCommentsByNews = (state) => state.comments.commentsByNews;

export const selectCommentsByNewsId = (newsId) =>
    createSelector([selectCommentsByNews], (commentsByNews) => {
        return commentsByNews[newsId] || [];
    });

export const selectCommentsLoading = (state) => state.comments.loading;
export const selectCommentsError = (state) => state.comments.error;
