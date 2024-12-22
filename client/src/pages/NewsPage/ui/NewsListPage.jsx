import { useEffect, useMemo } from 'react';
import styles from './NewsPage.module.scss';
import { NewsList } from '@features/newsList';
import { CustomCalendar } from '@widgets/Calendar/';
import { Sidebar } from '@widgets/Sidebar/';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
    fetchAllNews,
    filterNewsByDate,
    setPage,
} from '@entities/news/model/newsSlice.js';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';

const NewsListPage = () => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.news.selectedDate);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);

    useEffect(() => {
        dispatch(fetchAllNews());
    }, [dispatch]);

    const handleDateChange = (date) => {
        const dateString = date.toISOString();
        dispatch(filterNewsByDate(dateString));
        dispatch(setPage(0));
    };

    const handleResetDate = () => {
        dispatch(filterNewsByDate(null));
        dispatch(setPage(0));
        window.scrollTo(0, 0);
    };

    const newsDates = useMemo(() => {
        const dates = newsList.map((news) =>
            news.publishDate
                ? new Date(news.publishDate).toDateString()
                : new Date(news.createdAt).toDateString()
        );
        return Array.from(new Set(dates));
    }, [newsList]);

    return (
        <div className={styles.newsPage}>
            <div className={styles.newsContent}>
                <NewsList selectedDate={selectedDate} />
                <div className={styles.sidebarContainer}>
                    <p>Архивные новости</p>
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
export default NewsListPage;
