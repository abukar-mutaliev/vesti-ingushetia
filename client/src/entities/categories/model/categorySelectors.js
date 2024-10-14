import { createSelector } from 'reselect';

export const selectCategoriesState = (state) => state.categories;

export const selectCategories = createSelector(
    [selectCategoriesState],
    (categoriesState) => categoriesState.categories || [],
);

export const selectNewsByCategory = createSelector(
    [(state) => state.categories.newsByCategory, (_, categoryId) => categoryId],
    (newsByCategory, categoryId) => {
        return newsByCategory[categoryId] || [];
    },
);

export const selectCategoriesLoading = createSelector(
    [selectCategoriesState],
    (categoriesState) => categoriesState.loading,
);

export const selectCategoriesError = createSelector(
    [selectCategoriesState],
    (categoriesState) => categoriesState.error,
);
