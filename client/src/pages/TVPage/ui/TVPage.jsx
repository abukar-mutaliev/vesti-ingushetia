import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
    fetchAllNews,
    filterNewsByDate,
    setPage,
} from '@entities/news/model/newsSlice';
import { selectNewsWithVideos } from '@entities/news/model/newsSelectors';
import { CustomCalendar } from '@widgets/Calendar';
import styles from './TVPage.module.scss';
import { NewsList } from '@features/newsList';
import { Sidebar } from '@widgets/Sidebar';
import { selectCategories } from '@entities/categories/model/categorySelectors';
import { SlArrowRight } from 'react-icons/sl';
import { FaTimes } from 'react-icons/fa';
import { SideMenu } from '@widgets/SideMenu/index.js';

const TVPage = () => {
    const dispatch = useDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    const newsDates = useMemo(() => {
        const dates = newsList.map((news) =>
            news.publishDate
                ? new Date(news.publishDate).toDateString()
                : new Date(news.createdAt).toDateString(),
        );
        return Array.from(new Set(dates));
    }, [newsList]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    if (loading) {
        return <div>Загрузка...</div>;
    }

    return (
        <div className={styles.tvPage}>
            {isMenuOpen && (
                <div className={styles.backdrop} onClick={closeMenu}></div>
            )}
            <div className={styles.newsContent}>
                <div className={styles.mobileMenuIcon}>
                    <SlArrowRight size={20} onClick={toggleMenu} />
                </div>
                <div
                    className={`${styles.sideMenu} ${isMenuOpen ? styles.open : ''}`}
                >
                    <button className={styles.closeButton} onClick={closeMenu}>
                        <FaTimes size={20} />
                    </button>
                    <SideMenu onCategoryClick={closeMenu} />
                </div>
                <div>
                    <h1 className={styles.title}>ТВ</h1>
                    <NewsList
                        selectedDate={selectedDate}
                        onlyWithVideos={true}
                    />
                </div>
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
export default TVPage;
