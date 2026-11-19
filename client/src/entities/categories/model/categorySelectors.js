import { createSelector } from 'reselect';

const asList = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.categories)) return value.categories;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.rows)) return value.rows;
    if (Array.isArray(value?.news)) return value.news;
    return [];
};

export const selectCategoriesState = (state) => state.categories;

export const selectCategories = createSelector(
    [selectCategoriesState],
    (categoriesState) => asList(categoriesState?.categories),
);

export const selectNewsByCategory = createSelector(
    [(state) => state.categories.newsByCategory, (_, categoryId) => categoryId],
    (newsByCategory, categoryId) => asList(newsByCategory?.[categoryId]),
);

export const selectCategoriesLoading = createSelector(
    [selectCategoriesState],
    (categoriesState) => categoriesState.loading,
);

export const selectCategoriesError = createSelector(
    [selectCategoriesState],
    (categoriesState) => categoriesState.error,
);
