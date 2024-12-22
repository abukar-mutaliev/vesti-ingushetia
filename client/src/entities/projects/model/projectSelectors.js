import { createSelector } from 'reselect';

export const selectProjectState = (state) => state.projects;

export const selectProjectList = createSelector(
    [selectProjectState],
    (projectState) => projectState.projectList || [],
);

export const selectCurrentProject = createSelector(
    [selectProjectState],
    (projectState) => projectState.currentProject
);


export const selectProjectsWithImages = createSelector(
    [selectProjectList],
    (projects) =>
        projects.filter((project) =>
            project.mediaFiles?.some((media) => media.type === 'image')
        )
);

export const selectProjectsLoading = (state) => state.projects.loadingProjects;

export const selectProjectsError = createSelector(
    [selectProjectState],
    (projectState) => projectState.error,
);