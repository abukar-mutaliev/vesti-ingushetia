import { createSelector } from 'reselect';

export const selectNewsState = (state) => state.news;

export const selectSelectedDate = (state) => state.news.selectedDate;

export const selectNewsList = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsList || [],
);

export const selectAllNewsWithVideos = createSelector(
    [selectNewsList],
    (newsList) => newsList.filter(news => news.mediaFiles?.some(media => media.type === 'video')),
);

const isSameDate = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
};

export const selectNewsById = (state, id) => {
    return state.news.newsList.find((news) => news.id === parseInt(id, 10));
};

export const selectRandomizedNewsList = createSelector(
    [selectNewsList],
    (newsList) => {
        const shuffledNews = [...newsList];
        for (let i = shuffledNews.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledNews[i], shuffledNews[j]] = [shuffledNews[j], shuffledNews[i]];
        }
        return shuffledNews;
    }
);

export const selectNewsListByDate = createSelector(
    [selectNewsList, selectSelectedDate],
    (newsList, selectedDate) => {
        if (!selectedDate) return newsList;

        const selectedDateObj = new Date(selectedDate);

        return newsList
        .filter(news => isSameDate(news.publishDate, selectedDateObj))
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    }
);


export const selectFilteredNews = createSelector(
    [selectNewsListByDate],
    (dateFilteredNews) => dateFilteredNews
);

export const selectNewsWithVideos = createSelector(
    [selectFilteredNews],
    (newsList) =>
        newsList.filter((news) =>
            news.mediaFiles?.some((media) => media.type === 'video'),
        ),
);

export const selectLatestNews = createSelector(
    [selectFilteredNews],
    (newsList) => (newsList.length > 0 ? newsList[0] : null)
);

export const selectNewsListExcludingLast = createSelector(
    [selectNewsList],
    (newsList) => {
        if (newsList.length === 0) return [];
        return newsList.slice(1);
    }
);

export const selectCurrentPage = createSelector(
    [selectNewsState],
    (newsState) => newsState.currentPage,
);

export const selectNewsPerPage = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsPerPage,
);


export const selectFilteredNewsWithVideos = createSelector(
    [selectFilteredNews],
    (filteredNews) =>
        filteredNews.filter((news) =>
            news.mediaFiles?.some((media) => media.type === 'video')
        )
);

export const selectFilteredNewsExcludingLast = createSelector(
    [selectFilteredNews, selectLatestNews],
    (filteredNews, latestNews) => {
        if (!latestNews) return filteredNews;
        return filteredNews.filter((news) => news.id !== latestNews.id);
    }
);

export const selectFilteredNewsWithVideosExcludingLast = createSelector(
    [selectFilteredNewsWithVideos, selectLatestNews],
    (filteredNewsWithVideos, latestNews) => {
        if (!latestNews) return filteredNewsWithVideos;
        return filteredNewsWithVideos.filter((news) => news.id !== latestNews.id);
    }
);

export const selectPaginatedNewsExcludingLast = createSelector(
    [selectFilteredNewsExcludingLast, selectCurrentPage, selectNewsPerPage],
    (filteredNews, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNews.slice(start, end);
    }
);

export const selectPageCountExcludingLast = createSelector(
    [selectFilteredNewsExcludingLast, selectNewsPerPage],
    (filteredNews, newsPerPage) => {
        return Math.ceil(filteredNews.length / newsPerPage);
    },
);

export const selectPaginatedNewsWithVideosExcludingLast = createSelector(
    [selectFilteredNewsWithVideosExcludingLast, selectCurrentPage, selectNewsPerPage],
    (filteredNewsWithVideos, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNewsWithVideos.slice(start, end);
    },
);

export const selectPageCountWithVideosExcludingLast = createSelector(
    [selectFilteredNewsWithVideosExcludingLast, selectNewsPerPage],
    (filteredNewsWithVideos, newsPerPage) => {
        return Math.ceil(filteredNewsWithVideos.length / newsPerPage);
    },
);

export const selectError = createSelector(
    [selectNewsState],
    (newsState) => newsState.error,
);

export const selectArticlesNews = createSelector([selectNewsList], (newsList) => {
    const articles = newsList.filter((news) => {
        const hasArticlesCategory = news.categories.some(category => category.name === 'Статьи');
        return hasArticlesCategory;
    });
    return articles;
});

export const selectNewsLoading = createSelector(
    [selectNewsState],
    (newsState) => newsState.loading || newsState.newsLoading
);

export const selectNewsByIdLoading = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsByIdLoading,
);

export const selectInitialLoad = createSelector(
    [selectNewsState],
    (newsState) => newsState.initialLoad
);

export const selectPaginatedNews = createSelector(
    [selectFilteredNews, selectCurrentPage, selectNewsPerPage],
    (filteredNews, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNews.slice(start, end);
    }
);

export const selectPageCount = createSelector(
    [selectFilteredNews, selectNewsPerPage],
    (filteredNews, newsPerPage) => {
        return Math.ceil(filteredNews.length / newsPerPage);
    }
);

export const selectPaginatedNewsWithVideos = createSelector(
    [selectFilteredNewsWithVideos, selectCurrentPage, selectNewsPerPage],
    (filteredNewsWithVideos, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNewsWithVideos.slice(start, end);
    }
);

export const selectPageCountWithVideos = createSelector(
    [selectFilteredNewsWithVideos, selectNewsPerPage],
    (filteredNewsWithVideos, newsPerPage) => {
        return Math.ceil(filteredNewsWithVideos.length / newsPerPage);
    }
);