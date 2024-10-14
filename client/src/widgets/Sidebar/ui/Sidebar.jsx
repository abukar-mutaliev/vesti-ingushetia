import React from 'react';
import styles from './Sidebar.module.scss';
import { ListedNews } from '../../ListedNews/';
import { NewsCardSidebar } from '@widgets/NewsCardSidebar/index.js';

export const Sidebar = React.memo(({ newsList, categories }) => {
    if (!categories || !categories.length) {
        return null;
    }

    const shuffleArray = (array) => {
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [
                shuffledArray[j],
                shuffledArray[i],
            ];
        }
        return shuffledArray;
    };

    const getLastThreeNewsByCategory = (categoryId) => {
        const filteredNews = newsList.filter(
            (news) => news.categoryId === categoryId,
        );
        const shuffledNews = shuffleArray(filteredNews);
        return shuffledNews.slice(0, 3);
    };

    const categorizedNews = categories.map((category) => ({
        category,
        news: getLastThreeNewsByCategory(category.id),
    }));

    return (
        <div className={styles.sidebar}>
            {categorizedNews.map(({ category, news }) => (
                <div key={category.id} className={styles.categorySection}>
                    <ul className={styles.newsList}>
                        {news.map((item) => (
                            <NewsCardSidebar key={item.id} item={item} />
                        ))}
                    </ul>
                </div>
            ))}
            <div className={styles.listedNewsContainer}>
                <ListedNews newsList={newsList} />
            </div>
        </div>
    );
});
