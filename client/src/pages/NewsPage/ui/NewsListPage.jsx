import { useEffect, useMemo } from 'react';
import styles from './NewsPage.module.scss';
import { NewsList } from '@features/newsList';
import { CustomCalendar } from '@widgets/Calendar/';
import { Sidebar } from '@widgets/Sidebar/';
import { SideMenu } from '@widgets/SideMenu/';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
    fetchAllNews,
    filterNewsByDate,
    setPage,
} from '@entities/news/model/newsSlice.js';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';

const NewsListPage = () => {
    const dispatch = useDispatch();
    const selectedDate = useSelector((state) => state.news.selectedDate);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);

    useEffect(() => {
        dispatch(fetchAllNews());
        if (!categories.length) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

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
                : new Date(news.createdAt).toDateString(),
        );
        return Array.from(new Set(dates));
    }, [newsList]);

    return (
        <div className={styles.newsPage}>
            <div className={styles.newsContent}>
                <SideMenu />
                <div className={styles.mainContent}>
                    <NewsList
                        selectedDate={selectedDate}
                        excludeLastNews={false}
                    />
                </div>
                <div className={styles.sidebarContainer}>
                    <CustomCalendar
                        title="Архивные новости"
                        onDateChange={handleDateChange}
                        newsDates={newsDates}
                        onReset={selectedDate ? handleResetDate : undefined}
                    />
                    <Sidebar categories={categories} newsList={newsList} showElectionsBanner />
                </div>
            </div>
        </div>
    );
};
export default NewsListPage;
