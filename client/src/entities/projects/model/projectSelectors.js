import { createSelector } from 'reselect';

const asProjectList = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.projects)) return value.projects;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.rows)) return value.rows;
    return [];
};

const asMediaFiles = (project) =>
    Array.isArray(project?.mediaFiles) ? project.mediaFiles : [];

export const selectProjectState = (state) => state.projects;

export const selectProjectList = createSelector(
    [selectProjectState],
    (projectState) => asProjectList(projectState?.projectList),
);

export const selectCurrentProject = createSelector(
    [selectProjectState],
    (projectState) => projectState.currentProject,
);

export const selectProjectsWithImages = createSelector(
    [selectProjectList],
    (projects) =>
        projects.filter((project) =>
            asMediaFiles(project).some((media) => media?.type === 'image'),
        ),
);

export const selectProjectsLoading = (state) => state.projects.loadingProjects;
export const selectCurrentProjectLoading = (state) =>
    state.projects.loadingCurrentProject;

export const selectProjectsError = createSelector(
    [selectProjectState],
    (projectState) => projectState.error,
);
