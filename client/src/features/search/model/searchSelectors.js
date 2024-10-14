import { createSelector } from '@reduxjs/toolkit';

export const selectSearchState = (state) => state.search;

export const selectSearchResults = createSelector(
    selectSearchState,
    (searchState) => searchState.searchResults,
);

export const selectSearchLoading = createSelector(
    selectSearchState,
    (searchState) => searchState.loading,
);

export const selectSearchError = createSelector(
    selectSearchState,
    (searchState) => searchState.error,
);
