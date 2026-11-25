import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
    fetchAllNews,
    filterNewsByDate,
    setPage,
} from '@entities/news/model/newsSlice';
import {
    selectNewsLoading,
    selectFilteredNewsWithVideos,
    selectAllNewsWithVideos,
    selectSelectedDate,
} from '@entities/news/model/newsSelectors';
import { CustomCalendar } from '@widgets/Calendar';
import styles from './TVPage.module.scss';
import { NewsList } from '@features/newsList';
import { Sidebar } from '@widgets/Sidebar';
import { selectCategories } from '@entities/categories/model/categorySelectors';
import { SideMenu } from '@widgets/SideMenu/index.js';
import { Loader } from '@shared/ui/Loader/index.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';

const TVPage = () => {
    const dispatch = useDispatch();

    const selectedDate = useSelector(selectSelectedDate);
    const allNewsWithVideos = useSelector(selectAllNewsWithVideos, shallowEqual);
    const filteredNewsWithVideos = useSelector(selectFilteredNewsWithVideos, shallowEqual);

    const loading = useSelector(selectNewsLoading);
    const categories = useSelector(selectCategories, shallowEqual);

    useEffect(() => {
        if (allNewsWithVideos.length === 0) {
            dispatch(fetchAllNews());
        }
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, allNewsWithVideos.length, categories.length]);

    const handleDateChange = (date) => {
        const dateString = date.toISOString();
        dispatch(filterNewsByDate(dateString));
        dispatch(setPage(0));
    };

    const handleResetDate = () => {
        dispatch(filterNewsByDate(null));
        dispatch(setPage(0));
    };

    const newsDates = useMemo(() => {
        const dates = allNewsWithVideos.map((news) =>
            news.publishDate
                ? new Date(news.publishDate).toDateString()
                : new Date(news.createdAt).toDateString(),
        );
        return Array.from(new Set(dates));
    }, [allNewsWithVideos]);

    if (loading) {
        return (
            <div>
                <Loader />
            </div>
        );
    }

    return (
        <div className={styles.tvPage}>
            <div className={styles.newsContent}>
                <SideMenu />
                <div className={styles.newsListContainer}>
                    <h1 className={styles.title}>ТВ</h1>
                    <NewsList
                        selectedDate={selectedDate}
                        newsList={filteredNewsWithVideos}
                        onlyWithVideos={true}
                        excludeLastNews={false}
                    />
                </div>
                <div className={styles.sidebarContainer}>
                    <CustomCalendar
                        title="Архивные телепередачи"
                        onDateChange={handleDateChange}
                        newsDates={newsDates}
                        onReset={selectedDate ? handleResetDate : undefined}
                    />
                    <Sidebar categories={categories} newsList={filteredNewsWithVideos} />
                </div>
            </div>
        </div>
    );
};

export default TVPage;
