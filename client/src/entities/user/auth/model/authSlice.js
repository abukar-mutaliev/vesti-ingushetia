import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../api/authApi.js';
import * as profileApi from '../api/profileApi.js';

const initialState = {
    user: null,
    userList: [],
    isAuthenticated: false,
    isAdmin: false,
    replies: [],
    loading: false,
    error: null,
    success: false,
};

export const restoreAuth = createAsyncThunk(
    'auth/restoreAuth',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.fetchUserProfileApi();
            const user = response.data.user;
            return {
                user,
                isAdmin: user.isAdmin,
            };
        } catch (err) {
            return rejectWithValue('Не удалось восстановить аутентификацию');
        }
    },
);
export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await authApi.registerUserApi(userData);
            return response.data;
        } catch (err) {
            const errorMessage =
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Ошибка регистрации';
            return rejectWithValue(errorMessage);
        }
    },
);
export const updateUserRole = createAsyncThunk(
    'users/updateUserRole',
    async ({ userId, isAdmin }, { rejectWithValue }) => {
        try {
            const response = await authApi.updateUserRoleApi(userId, isAdmin);
            return response.data.user;
        } catch (err) {
            const errorMessage =
                err.response?.data?.error ||
                'Ошибка обновления роли пользователя';
            return rejectWithValue(errorMessage);
        }
    },
);

export const refreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.refreshTokenApi();
            return {
                accessToken: response.data.accessToken,
                user: response.data.user,
                isAdmin: response.data.user.isAdmin,
            };
        } catch (err) {
            const errorMessage =
                err.response?.data?.error || 'Ошибка обновления токена';
            return rejectWithValue(errorMessage);
        }
    },
);

export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.fetchUserProfileApi();
            return response.data;
        } catch (err) {
            const errorMessage =
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Ошибка получения профиля';
            return rejectWithValue(errorMessage);
        }
    },
);
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await authApi.loginUserApi(credentials);

            if (response.data && response.data.user) {
                return {
                    user: response.data.user,
                    isAdmin: response.data.user.isAdmin,
                };
            } else {
                throw new Error(
                    'Ошибка авторизации: данные пользователя отсутствуют',
                );
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Ошибка авторизации';

            return rejectWithValue(errorMessage);
        }
    },
);

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.logoutUserApi();
            return response.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data || 'Ошибка выхода из системы',
            );
        }
    },
);

export const updateAvatar = createAsyncThunk(
    'auth/updateAvatar',
    async (avatarFile, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('avatar', avatarFile);

            const response = await profileApi.updateAvatarApi(formData);
            return response.data;
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || 'Ошибка обновления аватара';
            return rejectWithValue(errorMessage);
        }
    },
);

export const fetchAllUsers = createAsyncThunk(
    'users/fetchAllUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.fetchUsersApi();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    },
);
export const fetchUserReplies = createAsyncThunk(
    'auth/fetchUserReplies',
    async (_, { rejectWithValue }) => {
        try {
            const response = await profileApi.fetchUserRepliesApi();
            return response.data.replies;
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || 'Ошибка получения ответов';
            return rejectWithValue(errorMessage);
        }
    },
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.success = false;
        },
        updateUser: (state, action) => {
            state.user = action.payload.user;
            state.isAdmin = action.payload.user.isAdmin;
            state.isAuthenticated = true;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(restoreAuth.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(restoreAuth.fulfilled, (state, action) => {
                const { user, isAdmin } = action.payload;
                state.user = user;
                state.isAuthenticated = true;
                state.isAdmin = isAdmin;
                state.loading = false;
            })
            .addCase(restoreAuth.rejected, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.isAdmin = false;
                state.user = null;
            })
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.isAdmin = action.payload.isAdmin;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(refreshToken.rejected, (state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.error =
                    'Сессия истекла, пожалуйста, выполните вход снова';
            })
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.success = true;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })
            .addCase(updateUserRole.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUserRole.fulfilled, (state, action) => {
                state.loading = false;
                const updatedUser = action.payload;
                const index = state.userList.findIndex(
                    (user) => user.id === updatedUser.id,
                );
                if (index !== -1) {
                    state.userList[index] = updatedUser;
                }
            })
            .addCase(updateUserRole.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                const { user, isAdmin } = action.payload;
                state.user = user;
                state.isAuthenticated = true;
                state.isAdmin = isAdmin;
                state.loading = false;
                state.error = null;
                state.success = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.isAdmin = false;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
                state.isAdmin = action.payload.isAdmin || false;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
                state.user = null;
                state.isAdmin = false;
            })
            .addCase(fetchUserReplies.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserReplies.fulfilled, (state, action) => {
                state.loading = false;
                state.replies = action.payload;
            })
            .addCase(fetchUserReplies.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateAvatar.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateAvatar.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) {
                    state.user.avatarUrl = action.payload.avatarUrl;
                }
            })
            .addCase(updateAvatar.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchAllUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.userList = action.payload;
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, clearSuccess } = authSlice.actions;

export default authSlice.reducer;
