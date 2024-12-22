import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as projectApi from '@entities/projects/api/projectApi';


const initialState = {
    projectList: [],
    currentProject: null,
    loadingProjects: false,
    loadingCurrentProject: false,
    loading: false,
    error: null,
    lastFetched: null,
};

export const fetchAllProjects = createAsyncThunk(
    'projects/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await projectApi.fetchAllProjectsApi();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Network Error');
        }
    },
);

export const fetchProjectById = createAsyncThunk(
    'projects/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await projectApi.fetchProjectByIdApi(id);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Network Error');
        }
    },
);

export const createProject = createAsyncThunk(
    'projects/create',
    async (projectData, { rejectWithValue }) => {
        try {
            const response = await projectApi.createProject(projectData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    },
);

export const updateProject = createAsyncThunk(
    'projects/update',
    async ({ id, projectData }, { rejectWithValue }) => {
        try {
            const response = await projectApi.updateProject(id, projectData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Network Error');
        }
    },
);

export const deleteProject = createAsyncThunk(
    'projects/delete',
    async (id, { rejectWithValue }) => {
        try {
            await projectApi.deleteProject(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Network Error');
        }
    },
);

const projectSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllProjects.pending, (state) => {
                state.loadingProjects = true;
                state.error = null;
            })
            .addCase(fetchAllProjects.fulfilled, (state, action) => {
                state.loadingProjects = false;
                state.projectList = action.payload || [];
                state.lastFetched = Date.now();
            })
            .addCase(fetchAllProjects.rejected, (state, action) => {
                state.loadingProjects = false;
                state.error = action.payload || 'Ошибка получения проектов';
            })
            .addCase(fetchProjectById.pending, (state) => {
                state.loadingCurrentProject = true;
                state.error = null;
            })
            .addCase(fetchProjectById.fulfilled, (state, action) => {
                const fetchedProject = {
                    ...action.payload,
                    videoUrls: Array.isArray(action.payload.videoUrls)
                        ? action.payload.videoUrls
                        : [],
                };
                state.currentProject = fetchedProject;
                const index = state.projectList.findIndex(
                    (project) => project.id === fetchedProject.id,
                );
                if (index !== -1) {
                    state.projectList[index] = fetchedProject;
                }
                state.loadingCurrentProject = false;
            })

            .addCase(fetchProjectById.rejected, (state, action) => {
                state.loadingCurrentProject = false;
                state.error = action.payload || 'Ошибка получения проекта';
            })
            .addCase(createProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.projectList.push(action.payload);
                state.loading = false;
            })
            .addCase(createProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка создания проекта';
            })
            .addCase(updateProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                const updatedProject = action.payload;
                const index = state.projectList.findIndex(
                    (project) => project.id === updatedProject.id,
                );
                if (index !== -1) {
                    state.projectList[index] = {
                        ...updatedProject,
                        videoUrls: Array.isArray(updatedProject.videoUrls)
                            ? updatedProject.videoUrls
                            : [],
                    };
                }
                state.loading = false;
            })
            .addCase(updateProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка изменения проекта';
            })
            .addCase(deleteProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.projectList = state.projectList.filter(
                    (project) => project.id !== action.payload,
                );
                state.loading = false;
            })
            .addCase(deleteProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка удаления проекта';
            });
    },
});

export default projectSlice.reducer;
