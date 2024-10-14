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

export const selectPage = selectCurrentPage;

export const selectSortedNews = createSelector([selectNewsList], (newsList) => {
    if (!newsList) return [];
    return [...newsList].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
});

export const selectLatestNews = createSelector(
    [selectSortedNews],
    (sortedNews) => sortedNews[0] || null,
);

export const selectNewsLoading = createSelector(
    [selectNewsState],
    (newsState) => newsState.loading,
);

export const selectNewsByIdLoading = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsByIdLoading,
);

export const selectFilteredNews = createSelector(
    [selectNewsState],
    (newsState) => newsState.filteredNews || newsState.newsList || [],
);

export const selectPaginatedNews = createSelector(
    [selectFilteredNews, selectPage, (_, newsPerPage) => newsPerPage],
    (filteredNews, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNews.slice(start, end);
    },
);

export const selectPageCount = createSelector(
    [selectFilteredNews, (_, newsPerPage) => newsPerPage],
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

export const selectFilteredNewsWithVideosByDate = createSelector(
    [selectNewsState],
    (newsState) => newsState.filteredNewsWithVideos || [],
);

export const selectPaginatedNewsWithVideos = createSelector(
    [
        selectFilteredNewsWithVideosByDate,
        selectPage,
        (_, newsPerPage) => newsPerPage,
    ],
    (newsList, page, newsPerPage) => {
        const start = page * newsPerPage;
        const end = start + newsPerPage;
        return newsList.slice(start, end);
    },
);

export const selectPageCountWithVideos = createSelector(
    [selectFilteredNewsWithVideosByDate, (_, newsPerPage) => newsPerPage],
    (newsList, newsPerPage) => {
        return Math.ceil(newsList.length / newsPerPage);
    },
);
