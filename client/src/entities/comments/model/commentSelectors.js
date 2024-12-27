import { createSelector } from 'reselect';

export const selectCommentsByNews = (state) => state.comments.commentsByNews;

export const selectAllComments = (state) => state.comments.comments;

export const selectCommentsGroupedByNews = createSelector(
    [selectAllComments],
    (comments) => {
        const commentsByNews = {};
        comments.forEach((comment) => {
            const newsId = comment.newsId;
            if (!commentsByNews[newsId]) {
                commentsByNews[newsId] = [];
            }
            commentsByNews[newsId].push(comment);
        });
        return commentsByNews;
    },
);

export const selectCommentsByNewsId = (newsId) =>
    createSelector([selectCommentsByNews], (commentsByNews) => {
        return commentsByNews[newsId] || [];
    });

export const selectCommentsLoading = (state) => state.comments.loading;

export const selectCommentsError = (state) => state.comments.error;


