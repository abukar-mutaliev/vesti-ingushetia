import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as newsApi from '@entities/news/api/newsApi.js';
import { updateNewsApi } from '@entities/news/api/newsApi.js';

const initialState = {
    newsList: [],
    filteredNews: [],
    filteredNewsWithVideos: [],
    currentNews: null,
    loading: false,
    newsLoading: false,
    newsByIdLoading: false,
    error: null,
    selectedDate: null,
    currentPage: 0,
    newsPerPage: 8,
};

export const fetchAllNews = createAsyncThunk(
    'news/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await newsApi.fetchNewsApi();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    },
);

export const fetchNewsById = createAsyncThunk(
    'news/fetchNewsById',
    async (id, { getState, rejectWithValue }) => {
        const state = getState();
        const currentNews = state.news.currentNews;

        if (currentNews && currentNews.id === id) {
            return currentNews;
        }
        try {
            const response = await newsApi.fetchNewsByIdApi(id);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    },
);

export const fetchNewsByDate = createAsyncThunk(
    'news/fetchNewsByDate',
    async (date, { rejectWithValue }) => {
        try {
            const serializedDate = date.toISOString();
            const response = await newsApi.fetchNewsByDateApi(serializedDate);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    },
);

export const createNews = createAsyncThunk(
    'news/createNews',
    async (newsData) => {
        const response = await newsApi.createNewsApi(newsData);
        return response.data;
    },
);

export const updateNews = createAsyncThunk(
    'news/updateNews',
    async ({ id, newsData }, { rejectWithValue }) => {
        try {
            const response = await newsApi.updateNewsApi(id, newsData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    },
);

export const deleteNews = createAsyncThunk(
    'news/deleteNews',
    async (id, { rejectWithValue }) => {
        try {
            await newsApi.deleteNewsApi(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    },
);

const saveNewsToLocalStorage = (newsList) => {
    localStorage.setItem('newsList', JSON.stringify(newsList));
};

const newsSlice = createSlice({
    name: 'news',
    initialState,
    reducers: {
        filterNewsByDate: (state, action) => {
            const selectedDateString = action.payload;
            state.selectedDate = selectedDateString;
            if (selectedDateString) {
                const selectedDate = new Date(selectedDateString);
                const selectedDateOnly = selectedDate.toDateString();
                state.filteredNews = state.newsList.filter((news) => {
                    const newsDate = new Date(news.createdAt).toDateString();
                    return newsDate === selectedDateOnly;
                });
                state.filteredNewsWithVideos = state.newsList.filter((news) => {
                    const newsDate = new Date(news.createdAt).toDateString();
                    const hasVideo = news.mediaFiles?.some(
                        (media) => media.type === 'video',
                    );
                    return newsDate === selectedDateOnly && hasVideo;
                });
            } else {
                state.filteredNews = state.newsList;
                state.filteredNewsWithVideos = state.newsList.filter((news) =>
                    news.mediaFiles?.some((media) => media.type === 'video'),
                );
            }
        },
        setPage: (state, action) => {
            state.currentPage = action.payload;
        },
        loadNewsFromLocalStorage: (state) => {
            const storedNews = localStorage.getItem('newsList');
            if (storedNews) {
                state.newsList = JSON.parse(storedNews);
                state.filteredNews = JSON.parse(storedNews);
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllNews.pending, (state) => {
                state.newsLoading = true;
                state.error = null;
            })
            .addCase(fetchAllNews.fulfilled, (state, action) => {
                state.newsLoading = false;
                state.newsList = Array.isArray(action.payload)
                    ? action.payload
                    : [];
                state.filteredNews = action.payload;
                state.filteredNewsWithVideos = state.newsList.filter((news) =>
                    news.mediaFiles?.some((media) => media.type === 'video'),
                );
                saveNewsToLocalStorage(state.newsList);
            })
            .addCase(fetchAllNews.rejected, (state, action) => {
                state.newsLoading = false;
                state.error =
                    action.error.message || 'Ошибка получения новостей';
            })
            .addCase(fetchNewsById.pending, (state) => {
                state.newsByIdLoading = true;
                state.error = null;
            })
            .addCase(fetchNewsById.fulfilled, (state, action) => {
                state.currentNews = action.payload;
                state.newsByIdLoading = false;
                saveNewsToLocalStorage(state.newsList);
            })
            .addCase(fetchNewsById.rejected, (state, action) => {
                state.newsByIdLoading = false;
                state.error =
                    action.error.message || 'Ошибка получения новости';
            })
            .addCase(fetchNewsByDate.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNewsByDate.fulfilled, (state, action) => {
                state.loading = false;
                state.newsList = action.payload;
                saveNewsToLocalStorage(state.newsList);
            })
            .addCase(fetchNewsByDate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(createNews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createNews.fulfilled, (state, action) => {
                state.newsList.push(action.payload);
                state.loading = false;
                saveNewsToLocalStorage(state.newsList);
            })
            .addCase(createNews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Ошибка создания новости';
            })
            .addCase(updateNews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateNews.fulfilled, (state, action) => {
                const index = state.newsList.findIndex(
                    (news) => news.id === action.payload.id,
                );
                if (index !== -1) {
                    state.newsList[index] = action.payload;
                }
                state.loading = false;
                saveNewsToLocalStorage(state.newsList);
            })
            .addCase(updateNews.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.error.message || 'Ошибка изменения новости';
            })
            .addCase(deleteNews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteNews.fulfilled, (state, action) => {
                state.newsList = state.newsList.filter(
                    (news) => news.id !== action.payload,
                );
                state.loading = false;
                saveNewsToLocalStorage(state.newsList);
            })
            .addCase(deleteNews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Ошибка удаления новости';
            });
    },
});

export const { filterNewsByDate, setPage, loadNewsFromLocalStorage } =
    newsSlice.actions;

export default newsSlice.reducer;
