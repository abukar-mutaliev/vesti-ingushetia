import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as commentsApi from '@entities/comments/api/commentApi.js';

const initialState = {
    commentsByNews: {},
    loading: false,
    error: null,
};
const updateCommentLikes = (
    comments,
    commentId,
    likesCount,
    likedByCurrentUser,
) => {
    return comments.map((comment) => {
        if (comment.id === commentId) {
            return {
                ...comment,
                likesCount,
                likedByCurrentUser,
            };
        } else if (comment.replies && comment.replies.length > 0) {
            return {
                ...comment,
                replies: updateCommentLikes(
                    comment.replies,
                    commentId,
                    likesCount,
                    likedByCurrentUser,
                ),
            };
        }
        return comment;
    });
};

const addReplyToComments = (comments, reply) => {
    return comments.map((comment) => {
        if (comment.id === reply.parentCommentId) {
            return {
                ...comment,
                replies: comment.replies
                    ? [...comment.replies, reply]
                    : [reply],
            };
        } else if (comment.replies && comment.replies.length > 0) {
            return {
                ...comment,
                replies: addReplyToComments(comment.replies, reply),
            };
        }
        return comment;
    });
};

export const fetchCommentsForNews = createAsyncThunk(
    'comments/fetchForNews',
    async (newsId, { rejectWithValue }) => {
        try {
            const response = await commentsApi.getCommentsForNews(newsId);
            return { newsId, comments: response.data };
        } catch (err) {
            return rejectWithValue(
                err.response?.data || 'Ошибка загрузки комментариев',
            );
        }
    },
);

export const addComment = createAsyncThunk(
    'comments/addComment',
    async ({ newsId, content, authorName, userId }, { rejectWithValue }) => {
        try {
            const response = await commentsApi.createComment({
                newsId,
                content,
                authorName,
                userId,
            });
            const newComment = {
                ...response.data,
                likesCount: 0,
                likedByCurrentUser: false,
                replies: [],
            };
            return { newsId, comment: newComment };
        } catch (error) {
            return rejectWithValue(
                error.response?.data || 'Ошибка добавления комментария',
            );
        }
    },
);
export const deleteComment = createAsyncThunk(
    'comments/deleteComment',
    async (commentId, { rejectWithValue }) => {
        try {
            await commentsApi.deleteCommentApi(commentId);
            return commentId;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || 'Ошибка удаления комментария',
            );
        }
    },
);

export const likeComment = createAsyncThunk(
    'comments/likeComment',
    async (commentId, { rejectWithValue }) => {
        try {
            const response = await commentsApi.likeCommentApi(commentId);
            return {
                commentId,
                likesCount: response.data.likesCount,
                likedByCurrentUser: response.data.likedByCurrentUser,
            };
        } catch (error) {
            return rejectWithValue(
                error.response?.data || 'Ошибка при лайке комментария',
            );
        }
    },
);

export const replyToComment = createAsyncThunk(
    'comments/replyToComment',
    async (
        { parentCommentId, content, authorName, userId },
        { rejectWithValue },
    ) => {
        try {
            const response = await commentsApi.replyToComment(parentCommentId, {
                content,
                authorName,
                userId,
            });
            const reply = {
                ...response.data,
                likesCount: 0,
                likedByCurrentUser: false,
                replies: [],
            };
            const newsId = response.data.newsId;
            return { newsId, reply };
        } catch (error) {
            return rejectWithValue(
                error.response?.data ||
                    'Ошибка добавления ответа на комментарий',
            );
        }
    },
);
const removeCommentById = (comments, commentId) => {
    return comments
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({
            ...comment,
            replies: comment.replies
                ? removeCommentById(comment.replies, commentId)
                : [],
        }));
};
const commentSlice = createSlice({
    name: 'comments',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCommentsForNews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCommentsForNews.fulfilled, (state, action) => {
                const { newsId, comments } = action.payload;
                state.commentsByNews[newsId] = comments;
                state.loading = false;
            })
            .addCase(fetchCommentsForNews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addComment.pending, (state) => {
                state.loading = true;
            })
            .addCase(addComment.fulfilled, (state, action) => {
                const { newsId, comment } = action.payload;
                if (state.commentsByNews[newsId]) {
                    state.commentsByNews[newsId].push(comment);
                } else {
                    state.commentsByNews[newsId] = [comment];
                }
                state.loading = false;
            })
            .addCase(deleteComment.fulfilled, (state, action) => {
                const commentId = action.payload;
                Object.keys(state.commentsByNews).forEach((newsId) => {
                    state.commentsByNews[newsId] = removeCommentById(
                        state.commentsByNews[newsId],
                        commentId,
                    );
                });
            })
            .addCase(addComment.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })

            .addCase(likeComment.fulfilled, (state, action) => {
                const { commentId, likesCount, likedByCurrentUser } =
                    action.payload;
                Object.keys(state.commentsByNews).forEach((newsId) => {
                    state.commentsByNews[newsId] = updateCommentLikes(
                        state.commentsByNews[newsId],
                        commentId,
                        likesCount,
                        likedByCurrentUser,
                    );
                });
            })
            .addCase(likeComment.rejected, (state, action) => {
                state.error = action.payload;
            })

            .addCase(replyToComment.fulfilled, (state, action) => {
                const { newsId, reply } = action.payload;
                if (state.commentsByNews[newsId]) {
                    state.commentsByNews[newsId] = addReplyToComments(
                        state.commentsByNews[newsId],
                        reply,
                    );
                }
            })
            .addCase(replyToComment.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export default commentSlice.reducer;
