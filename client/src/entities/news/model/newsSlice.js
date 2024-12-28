import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as newsApi from '@entities/news/api/newsApi';

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

const hasVideo = (news) => {
    return news.mediaFiles?.some(
        (media) => media.type === 'video' && media.url && media.url.trim() !== ''
    );
};


const isSameDate = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
};

export const fetchAllNews = createAsyncThunk(
    'news/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await newsApi.fetchNewsApi();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Network Error');
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
            return rejectWithValue(err.response?.data || 'Network Error');
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
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    },
);

export const createNews = createAsyncThunk(
    'news/createNews',
    async (newsData, { rejectWithValue }) => {
        try {
            const response = await newsApi.createNewsApi(newsData);
            return response.data;
        } catch (error) {
            console.error('Detailed error:', error.response?.data);
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    }
);
export const updateNews = createAsyncThunk(
    'news/updateNews',
    async ({ id, newsData }, { rejectWithValue }) => {
        try {
            const response = await newsApi.updateNewsApi(id, newsData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    },
);

export const deleteNews = createAsyncThunk(
    'news/deleteNews',
    async (id, { rejectWithValue }) => {
        try {
            await newsApi.deleteNewsApi(id);
            const response = await newsApi.fetchNewsApi();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Network Error');
        }
    },
);

const newsSlice = createSlice({
    name: 'news',
    initialState,
    reducers: {
        filterNewsByDate: (state, action) => {
            const selectedDate = action.payload;
            state.selectedDate = selectedDate;

            if (selectedDate) {
                const selectedDateObj = new Date(selectedDate);

                // Фильтруем используя publishDate
                state.filteredNews = state.newsList
                .filter(news => isSameDate(news.publishDate, selectedDateObj))
                .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

                // Фильтруем новости с видео
                state.filteredNewsWithVideos = state.filteredNews
                .filter(news => news.mediaFiles?.some(media => media.type === 'video'));
            } else {
                // Если дата не выбрана, показываем все новости
                state.filteredNews = state.newsList;
                state.filteredNewsWithVideos = state.newsList
                .filter(news => news.mediaFiles?.some(media => media.type === 'video'));
            }

            state.currentPage = 0;
        },
        setPage: (state, action) => {
            state.currentPage = action.payload;
        },
        setSelectedDate: (state, action) => {
            state.selectedDate = action.payload;
            if (action.payload) {
                newsSlice.caseReducers.filterNewsByDate(state, action);
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
                    ? action.payload.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
                    : [];
                state.filteredNews = state.newsList;
                state.filteredNewsWithVideos = state.newsList.filter((news) =>
                    hasVideo(news),
                );
            })
            .addCase(fetchAllNews.rejected, (state, action) => {
                state.newsLoading = false;
                state.error = action.payload || 'Ошибка получения новостей';
            })
            .addCase(fetchNewsById.pending, (state) => {
                state.newsByIdLoading = true;
                state.error = null;
            })
            .addCase(fetchNewsById.fulfilled, (state, action) => {
                state.currentNews = action.payload;
                state.newsByIdLoading = false;
                const index = state.newsList.findIndex(
                    (news) => news.id === action.payload.id,
                );
                if (index !== -1) {
                    state.newsList[index] = action.payload;
                }
            })
            .addCase(fetchNewsById.rejected, (state, action) => {
                state.newsByIdLoading = false;
                state.error = action.payload || 'Ошибка получения новости';
            })
            .addCase(fetchNewsByDate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNewsByDate.fulfilled, (state, action) => {
                state.loading = false;
                state.newsList = action.payload;
                state.filteredNews = action.payload;
                state.filteredNewsWithVideos = state.newsList.filter((news) =>
                    hasVideo(news),
                );
            })
            .addCase(fetchNewsByDate.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.payload || 'Ошибка получения новостей по дате';
            })
            .addCase(createNews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createNews.fulfilled, (state, action) => {
                state.newsList.push(action.payload);
                state.newsList.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

                state.filteredNews = state.selectedDate
                    ? state.newsList.filter(news => isSameDate(news.publishDate, new Date(state.selectedDate)))
                    : state.newsList;

                state.filteredNewsWithVideos = state.filteredNews.filter(news => hasVideo(news));

                state.loading = false;
            })
            .addCase(createNews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка создания новости';
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

                    state.newsList.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

                    state.filteredNews = state.selectedDate
                        ? state.newsList.filter(news => isSameDate(news.publishDate, new Date(state.selectedDate)))
                        : state.newsList;

                    state.filteredNewsWithVideos = state.filteredNews.filter(news => hasVideo(news));
                }
                state.loading = false;
            })
            .addCase(updateNews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка изменения новости';
            })
            .addCase(deleteNews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteNews.fulfilled, (state, action) => {
                state.newsList = state.newsList.filter(
                    (news) => news.id !== action.payload,
                );
                state.filteredNews = state.filteredNews.filter(
                    (news) => news.id !== action.payload,
                );
                state.filteredNewsWithVideos =
                    state.filteredNewsWithVideos.filter(
                        (news) => news.id !== action.payload,
                    );
                state.loading = false;
            })
            .addCase(deleteNews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка удаления новости';
            });
    },
});

export const { filterNewsByDate, setPage, loadNewsFromLocalStorageAction } =
    newsSlice.actions;

export default newsSlice.reducer;
