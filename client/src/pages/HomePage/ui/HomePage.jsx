import { useEffect, useState, useCallback } from 'react';
import styles from './HomePage.module.scss';
import { SideMenu } from '@widgets/SideMenu/';
import { MainNews } from '@widgets/MainNews/';
import { NewsList } from '@features/newsList';
import { Sidebar } from '@widgets/Sidebar/';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FaTimes } from 'react-icons/fa';
import { SlArrowRight } from 'react-icons/sl';
import { ProjectsSection } from '@features/projects/ProjectsSection/';
import { ProjectsSlider } from '@features/projects/ProjectsSlider/';

const HomePage = () => {
    const dispatch = useDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const newsList = useSelector(selectNewsList, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);

    const loadCategories = useCallback(() => {
        if (!categories.length) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <div>
            <div className={styles.homePage}>
                {isMenuOpen && (
                    <div className={styles.backdrop} onClick={closeMenu}></div>
                )}

                <div
                    className={`${styles.sideMenu} ${isMenuOpen ? styles.open : ''}`}
                >
                    <button className={styles.closeButton} onClick={closeMenu}>
                        <FaTimes size={20} />
                    </button>
                    <SideMenu onCategoryClick={closeMenu} />
                </div>
                <div className={styles.mainContent}>
                    <div className={styles.mobileMenuIcon}>
                        <SlArrowRight size={20} onClick={toggleMenu} />
                    </div>
                    <MainNews />
                    <NewsList newsList={newsList} />
                </div>
                <Sidebar categories={categories} newsList={newsList} />
            </div>
            <div className={styles.projectsSliderContainer}>
                <ProjectsSlider />
            </div>
        </div>
    );
};

export default HomePage;
