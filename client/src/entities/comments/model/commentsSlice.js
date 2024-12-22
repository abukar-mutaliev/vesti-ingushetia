import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as commentsApi from '@entities/comments/api/commentApi.js';

const initialState = {
    comments: [],
    commentsByNews: {},
    loading: false,
    error: null,
};

const updateCommentLikes = (comments, commentId, likesCount, likedByCurrentUser) => {
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


export const fetchCommentsForNews = createAsyncThunk(
    'comments/fetchForNews',
    async (newsId, { rejectWithValue, getState }) => {
        const state = getState();

        if (state.comments.commentsByNews[newsId]) {
            return { newsId, comments: state.comments.commentsByNews[newsId] };
        }

        try {
            const response = await commentsApi.getCommentsForNewsApi(newsId);
            return { newsId, comments: response.data };
        } catch (err) {
            return rejectWithValue(
                err.response?.data || 'Ошибка загрузки комментариев',
            );
        }
    }
);

export const fetchAllComments = createAsyncThunk(
    'comments/fetchAllComments',
    async (_, { rejectWithValue }) => {
        try {
            const response = await commentsApi.getAllCommentsApi();
            return response.data;
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
            const response = await commentsApi.createCommentApi({
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
    }
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
            const response = await commentsApi.replyToCommentApi(
                parentCommentId,
                {
                    content,
                    authorName,
                    userId,
                },
            );
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
            state.comments = [...state.comments, ...comments];
            state.loading = false;
        })
        .addCase(fetchCommentsForNews.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(fetchAllComments.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchAllComments.fulfilled, (state, action) => {
            state.loading = false;
            state.comments = action.payload;
            const commentsByNews = {};
            action.payload.forEach((comment) => {
                const newsId = comment.newsId;
                if (!commentsByNews[newsId]) {
                    commentsByNews[newsId] = [];
                }
                commentsByNews[newsId].push(comment);
            });
            state.commentsByNews = commentsByNews;
        })
        .addCase(fetchAllComments.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(addComment.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(addComment.fulfilled, (state, action) => {
            const { newsId, comment } = action.payload;

            if (state.commentsByNews[newsId]) {
                state.commentsByNews[newsId].push(comment);
            } else {
                state.commentsByNews[newsId] = [comment];
            }

            state.comments.push(comment);
            state.loading = false;
        })
        .addCase(addComment.rejected, (state, action) => {
            state.error = action.payload;
            state.loading = false;
        })
        .addCase(deleteComment.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteComment.fulfilled, (state, action) => {
            const commentId = action.payload;
            Object.keys(state.commentsByNews).forEach((newsId) => {
                state.commentsByNews[newsId] = removeCommentById(
                    state.commentsByNews[newsId],
                    commentId,
                );
            });
            state.comments = removeCommentById(state.comments, commentId);
            state.loading = false;
        })
        .addCase(deleteComment.rejected, (state, action) => {
            state.error = action.payload;
            state.loading = false;
        })
        .addCase(likeComment.pending, (state) => {
            state.loading = true;
            state.error = null;
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
            state.comments = updateCommentLikes(
                state.comments,
                commentId,
                likesCount,
                likedByCurrentUser,
            );
            state.loading = false;
        })
        .addCase(likeComment.rejected, (state, action) => {
            state.error = action.payload;
            state.loading = false;
        })
        .addCase(replyToComment.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(replyToComment.fulfilled, (state, action) => {
            const { newsId, reply } = action.payload;
            if (state.commentsByNews[newsId]) {
                state.commentsByNews[newsId] = addReplyToComments(
                    state.commentsByNews[newsId],
                    reply,
                );
            }
            state.comments.push(reply);
            state.loading = false;
        })
        .addCase(replyToComment.rejected, (state, action) => {
            state.error = action.payload;
            state.loading = false;
        });
    },
});

export default commentSlice.reducer;
