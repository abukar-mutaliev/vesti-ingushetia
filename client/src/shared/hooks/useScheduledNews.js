import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
    fetchMyScheduledNews,
    fetchAllScheduledNews,
    cancelScheduledNews,
    publishScheduledNewsNow,
    fetchScheduledNewsStats,
    createScheduledNews,
    clearError
} from '@entities/news/model/scheduledNewsSlice.js';
import {
    selectMyScheduledNews,
    selectAllScheduledNews,
    selectScheduledNewsLoading,
    selectScheduledNewsError,
    selectScheduledNewsStats,
    selectScheduledNewsOnly,
    selectScheduledNewsWithErrors,
    selectOverdueScheduledNews,
    selectUpcomingScheduledNews,
    selectScheduledNewsCount
} from '@entities/news/model/scheduledNewsSelectors.js';

export const useScheduledNews = (isAdmin = false) => {
    const dispatch = useDispatch();
    
    // Селекторы
    const myScheduledNews = useSelector(selectMyScheduledNews);
    const allScheduledNews = useSelector(selectAllScheduledNews);
    const loading = useSelector(selectScheduledNewsLoading);
    const error = useSelector(selectScheduledNewsError);
    const stats = useSelector(selectScheduledNewsStats);
    const scheduledOnly = useSelector(selectScheduledNewsOnly);
    const newsWithErrors = useSelector(selectScheduledNewsWithErrors);
    const overdueNews = useSelector(selectOverdueScheduledNews);
    const upcomingNews = useSelector(selectUpcomingScheduledNews);
    const scheduledCount = useSelector(selectScheduledNewsCount);

    // Действия
    const loadScheduledNews = useCallback(() => {
        if (isAdmin) {
            dispatch(fetchAllScheduledNews());
        } else {
            dispatch(fetchMyScheduledNews());
        }
    }, [dispatch, isAdmin]);

    const loadStats = useCallback(() => {
        if (isAdmin) {
            dispatch(fetchScheduledNewsStats());
        }
    }, [dispatch, isAdmin]);

    const createScheduled = useCallback((newsData) => {
        return dispatch(createScheduledNews(newsData));
    }, [dispatch]);

    const cancelNews = useCallback((newsId) => {
        return dispatch(cancelScheduledNews(newsId));
    }, [dispatch]);

    const publishNow = useCallback((newsId) => {
        return dispatch(publishScheduledNewsNow(newsId));
    }, [dispatch]);

    const clearNewsError = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    // Утилиты
    const isOverdue = useCallback((publishDate) => {
        return new Date(publishDate) <= new Date();
    }, []);

    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const getNewsToDisplay = useCallback(() => {
        return isAdmin ? allScheduledNews : myScheduledNews;
    }, [isAdmin, allScheduledNews, myScheduledNews]);

    const filterNews = useCallback((filter) => {
        const newsToFilter = getNewsToDisplay();
        
        switch (filter) {
            case 'scheduled':
                return newsToFilter.filter(news => news.status === 'scheduled');
            case 'error':
                return newsToFilter.filter(news => news.status === 'error');
            case 'overdue':
                return newsToFilter.filter(news => 
                    news.status === 'scheduled' && isOverdue(news.publishDate)
                );
            case 'upcoming':
                return newsToFilter.filter(news => 
                    news.status === 'scheduled' && !isOverdue(news.publishDate)
                );
            default:
                return newsToFilter;
        }
    }, [getNewsToDisplay, isOverdue]);

    return {
        // Данные
        myScheduledNews,
        allScheduledNews,
        loading,
        error,
        stats,
        scheduledOnly,
        newsWithErrors,
        overdueNews,
        upcomingNews,
        scheduledCount,
        
        // Действия
        loadScheduledNews,
        loadStats,
        createScheduled,
        cancelNews,
        publishNow,
        clearNewsError,
        
        // Утилиты
        isOverdue,
        formatDate,
        getNewsToDisplay,
        filterNews
    };
}; 