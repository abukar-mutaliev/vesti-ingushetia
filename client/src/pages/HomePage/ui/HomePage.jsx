import React, { useEffect, useState } from 'react';
import styles from './HomePage.module.scss';
import { SideMenu } from '@widgets/SideMenu/';
import { MainNews } from '@widgets/MainNews/';
import { NewsList } from '@features/newsList';
import { Sidebar } from '@widgets/Sidebar/';
import { fetchAllNews } from '@entities/news/model/newsSlice';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';
import { VideoSlider } from '@widgets/VideoSlider/index.js';
import { NewsCardDetailPage } from '@widgets/NewsCardDetailPage/index.js';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FaBars, FaTimes } from 'react-icons/fa';
import { SlArrowRight } from 'react-icons/sl';

export const HomePage = () => {
    const dispatch = useDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const newsList = useSelector(selectNewsList, shallowEqual);
    const categories = useSelector(selectCategories);

    const loadNews = () => {
        if (!newsList.length) {
            dispatch(fetchAllNews());
        }
    };

    const loadCategories = () => {
        if (!categories.length) {
            dispatch(fetchCategories());
        }
    };

    useEffect(() => {
        loadNews();
        loadCategories();
    }, [loadNews, loadCategories]);

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
            <div className={styles.videoSliderContainer}>
                <VideoSlider />
            </div>
            <div className={styles.newsCardContainer}>
                <h2>Так же читайте</h2>
                <div className={styles.newsGrid}>
                    {newsList.map((newsItem) => (
                        <NewsCardDetailPage key={newsItem.id} news={newsItem} />
                    ))}
                </div>
            </div>
        </div>
    );
};
