import { createSelector } from 'reselect';

export const selectAuthState = (state) => state.auth;
export const selectUser = createSelector(
    [selectAuthState],
    (authState) => authState.user,
);

export const selectUsers = createSelector(
    [selectAuthState],
    (authState) => authState.userList,
);

export const selectUserAuth = createSelector(
    [selectAuthState],
    (authState) => authState.isAuthenticated,
);

export const selectIsAdmin = createSelector(
    [selectAuthState],
    (authState) => authState.isAdmin,
);

export const selectLoading = createSelector(
    [selectAuthState],
    (authState) => authState.loading,
);

export const selectAuthError = createSelector(
    [selectAuthState],
    (authState) => authState.error,
);
export const selectAuthSuccess = createSelector(
    [selectAuthState],
    (authState) => authState.success,
);
export const selectUserReplies = (state) => state.auth.replies;
