import { useEffect, useState, useCallback } from 'react';
import styles from './HomePage.module.scss';
import { SideMenu } from '@widgets/SideMenu/';
import { MainNews } from '@widgets/MainNews/';
import { NewsList } from '@features/newsList';
import { Sidebar } from '@widgets/Sidebar/';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import { selectNewsList, selectNewsLoading, selectNewsListExcludingLast } from '@entities/news/model/newsSelectors.js';

import { useDispatch, useSelector } from 'react-redux';
import { FaTimes } from 'react-icons/fa';
import { SlArrowRight } from 'react-icons/sl';
import { ProjectsSlider } from '@features/projects/ProjectsSlider/';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { Loader } from '@shared/ui/Loader/index.js';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';

const HomePage = () => {
    const dispatch = useDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const newsList = useSelector(selectNewsList);
    const newsListExcludingLast = useSelector(selectNewsListExcludingLast);
    const categories = useSelector(selectCategories);
    const loading = useSelector(selectNewsLoading);

    const loadCategories = useCallback(() => {
        if (!categories.length) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    useEffect(() => {
        loadCategories();
        dispatch(fetchAllNews());
    }, [loadCategories, dispatch]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    if (loading) {
        return (
            <div className={styles.homePageLoader}>
                <Loader />
            </div>
        );
    }

    return (
        <div className={styles.homePage}>
            {isMenuOpen && (
                <div className={styles.backdrop} onClick={closeMenu}></div>
            )}
            <div className={styles.mobileMenuIcon}>
                <SlArrowRight size={20} onClick={toggleMenu}/>
            </div>
            <div className={styles.homePageContainer}>
                <div
                    className={`${styles.sideMenu} ${isMenuOpen ? styles.open : ''}`}
                >
                    <button className={styles.closeButton} onClick={closeMenu}>
                        <FaTimes size={20}/>
                    </button>
                    <SideMenu onCategoryClick={closeMenu}/>
                </div>
                <div className={styles.mainContent}>
                    {newsList.length > 0 && (
                        <MainNews news={newsList[0]}/>
                    )}
                    <NewsList
                        newsList={newsListExcludingLast}

                    />
                </div>
                <div className={styles.sidebarContainer}>
                    <Sidebar categories={categories} newsList={newsListExcludingLast}/>
                </div>
            </div>
            <div className={styles.projectsSliderContainer}>
                <ProjectsSlider/>
            </div>
        </div>
    );
};

export default HomePage;
