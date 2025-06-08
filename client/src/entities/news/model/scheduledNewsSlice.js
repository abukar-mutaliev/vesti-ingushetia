import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as scheduledNewsApi from '@entities/news/api/scheduledNewsApi';

const initialState = {
    scheduledNews: [],
    myScheduledNews: [],
    stats: null,
    loading: false,
    error: null,
};

// Получить мои отложенные новости
export const fetchMyScheduledNews = createAsyncThunk(
    'scheduledNews/fetchMy',
    async (_, { rejectWithValue }) => {
        try {
            const response = await scheduledNewsApi.fetchMyScheduledNewsApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    }
);

// Получить все отложенные новости (только админы)
export const fetchAllScheduledNews = createAsyncThunk(
    'scheduledNews/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await scheduledNewsApi.fetchAllScheduledNewsApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    }
);

// Отменить отложенную новость
export const cancelScheduledNews = createAsyncThunk(
    'scheduledNews/cancel',
    async (id, { rejectWithValue }) => {
        try {
            await scheduledNewsApi.cancelScheduledNewsApi(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    }
);

// Опубликовать отложенную новость немедленно
export const publishScheduledNewsNow = createAsyncThunk(
    'scheduledNews/publishNow',
    async (id, { rejectWithValue }) => {
        try {
            const response = await scheduledNewsApi.publishScheduledNewsNowApi(id);
            return { id, publishedNews: response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    }
);

// Получить статистику планировщика
export const fetchScheduledNewsStats = createAsyncThunk(
    'scheduledNews/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await scheduledNewsApi.getScheduledNewsStatsApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    }
);

// Создать отложенную новость
export const createScheduledNews = createAsyncThunk(
    'scheduledNews/create',
    async (newsData, { rejectWithValue }) => {
        try {
            const response = await scheduledNewsApi.createScheduledNewsApi(newsData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    }
);

const scheduledNewsSlice = createSlice({
    name: 'scheduledNews',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearScheduledNews: (state) => {
            state.scheduledNews = [];
            state.myScheduledNews = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // Получить мои отложенные новости
            .addCase(fetchMyScheduledNews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyScheduledNews.fulfilled, (state, action) => {
                state.loading = false;
                state.myScheduledNews = action.payload;
            })
            .addCase(fetchMyScheduledNews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка получения отложенных новостей';
            })
            
            // Получить все отложенные новости
            .addCase(fetchAllScheduledNews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllScheduledNews.fulfilled, (state, action) => {
                state.loading = false;
                state.scheduledNews = action.payload;
            })
            .addCase(fetchAllScheduledNews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка получения всех отложенных новостей';
            })
            
            // Отменить отложенную новость
            .addCase(cancelScheduledNews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(cancelScheduledNews.fulfilled, (state, action) => {
                state.loading = false;
                const cancelledId = action.payload;
                state.myScheduledNews = state.myScheduledNews.filter(news => news.id !== cancelledId);
                state.scheduledNews = state.scheduledNews.filter(news => news.id !== cancelledId);
            })
            .addCase(cancelScheduledNews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка отмены отложенной новости';
            })
            
            // Опубликовать отложенную новость немедленно
            .addCase(publishScheduledNewsNow.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(publishScheduledNewsNow.fulfilled, (state, action) => {
                state.loading = false;
                const { id } = action.payload;
                state.myScheduledNews = state.myScheduledNews.filter(news => news.id !== id);
                state.scheduledNews = state.scheduledNews.filter(news => news.id !== id);
            })
            .addCase(publishScheduledNewsNow.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка публикации отложенной новости';
            })
            
            // Получить статистику
            .addCase(fetchScheduledNewsStats.fulfilled, (state, action) => {
                state.stats = action.payload;
            })
            
            // Создать отложенную новость
            .addCase(createScheduledNews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createScheduledNews.fulfilled, (state, action) => {
                state.loading = false;
                state.myScheduledNews.push(action.payload);
            })
            .addCase(createScheduledNews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка создания отложенной новости';
            });
    },
});

export const { clearError, clearScheduledNews } = scheduledNewsSlice.actions;
export default scheduledNewsSlice.reducer; 