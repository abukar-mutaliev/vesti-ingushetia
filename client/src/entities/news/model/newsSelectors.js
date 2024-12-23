import { createSelector } from 'reselect';

export const selectNewsState = (state) => state.news;

export const selectNewsList = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsList || [],
);

export const selectCurrentNews = createSelector(
    [selectNewsState],
    (newsState) => newsState.currentNews,
);

export const selectSelectedDate = createSelector(
    [selectNewsState],
    (newsState) => newsState.selectedDate,
);

export const selectCurrentPage = createSelector(
    [selectNewsState],
    (newsState) => newsState.currentPage,
);

export const selectNewsPerPage = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsPerPage,
);

export const selectFilteredNews = createSelector(
    [selectNewsState],
    (newsState) => newsState.filteredNews || newsState.newsList || [],
);

export const selectFilteredNewsWithVideos = createSelector(
    [selectNewsState],
    (newsState) => newsState.filteredNewsWithVideos || [],
);

export const selectPaginatedNews = createSelector(
    [selectFilteredNews, selectCurrentPage, selectNewsPerPage],
    (filteredNews, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNews.slice(start, end);
    },
);

export const selectPageCount = createSelector(
    [selectFilteredNews, selectNewsPerPage],
    (filteredNews, newsPerPage) => {
        return Math.ceil(filteredNews.length / newsPerPage);
    },
);

export const selectNewsWithVideos = createSelector(
    [selectNewsList],
    (newsList) =>
        newsList.filter((news) =>
            news.mediaFiles?.some((media) => media.type === 'video'),
        ),
);

export const selectPaginatedNewsWithVideos = createSelector(
    [selectFilteredNewsWithVideos, selectCurrentPage, selectNewsPerPage],
    (filteredNewsWithVideos, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNewsWithVideos.slice(start, end);
    },
);

export const selectPageCountWithVideos = createSelector(
    [selectFilteredNewsWithVideos, selectNewsPerPage],
    (filteredNewsWithVideos, newsPerPage) => {
        return Math.ceil(filteredNewsWithVideos.length / newsPerPage);
    },
);

export const selectLatestNews = createSelector([selectNewsList], (newsList) =>
    newsList.length > 0 ? newsList[0] : null,
);

export const selectNewsLoading = createSelector(
    [selectNewsState],
    (newsState) => newsState.loading,
);


export const selectError = createSelector(
    [selectNewsState],
    (newsState) => newsState.error,
);

export const selectArticlesNews = createSelector([selectNewsList], (newsList) =>
    newsList.filter((news) => news.category?.name === 'Статьи'),
);

export const selectLoading = createSelector(
    [selectNewsState],
    (newsState) => newsState.loading || newsState.newsLoading
);

export const selectNewsByIdLoading = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsByIdLoading,
);

export const selectNewsLoadingAll = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsLoading
);

export const selectIsLoading = createSelector(
    [selectNewsLoading, selectNewsLoadingAll],
    (loading, newsLoading) => loading || newsLoading
);