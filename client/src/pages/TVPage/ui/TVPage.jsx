import React, { useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
    fetchAllNews,
    filterNewsByDate,
    setPage,
} from '@entities/news/model/newsSlice';
import {
    selectFilteredNewsWithVideosByDate,
    selectNewsWithVideos,
} from '@entities/news/model/newsSelectors';
import { CustomCalendar } from '@widgets/Calendar';
import styles from './TVPage.module.scss';
import { NewsList } from '@features/newsList';
import { Sidebar } from '@widgets/Sidebar';
import { selectCategories } from '@entities/categories/model/categorySelectors';

export const TVPage = () => {
    const dispatch = useDispatch();

    const selectedDate = useSelector((state) => state.news.selectedDate);
    const newsList = useSelector(selectNewsWithVideos, shallowEqual);

    const loading = useSelector((state) => state.news.newsLoading);
    const categories = useSelector(selectCategories, shallowEqual);

    useEffect(() => {
        if (!newsList.length) {
            dispatch(fetchAllNews());
        }
    }, [dispatch, newsList.length]);

    const handleDateChange = (date) => {
        const dateString = date.toISOString();
        dispatch(filterNewsByDate(dateString));
        dispatch(setPage(0));
    };

    const handleResetDate = () => {
        dispatch(filterNewsByDate(null));
        dispatch(setPage(0));
    };

    const newsDates = newsList.map((news) =>
        new Date(news.createdAt).toDateString(),
    );

    if (loading) {
        return <div>Загрузка...</div>;
    }

    return (
        <div className={styles.tvPage}>
            <h1 className={styles.title}>ТВ</h1>
            <div className={styles.newsContent}>
                <NewsList selectedDate={selectedDate} onlyWithVideos={true} />
                <div className={styles.sidebarContainer}>
                    <p>Архивные телепередачи</p>
                    <CustomCalendar
                        onDateChange={handleDateChange}
                        newsDates={newsDates}
                    />
                    {selectedDate && (
                        <button
                            onClick={handleResetDate}
                            className={styles.resetDateButton}
                        >
                            Показать все новости
                        </button>
                    )}
                    <Sidebar categories={categories} newsList={newsList} />
                </div>
            </div>
        </div>
    );
};
