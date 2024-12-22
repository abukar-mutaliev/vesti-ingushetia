import React, { useMemo } from 'react';
import styles from './Sidebar.module.scss';
import { ListedNews } from '../../ListedNews/';
import { NewsCardSidebar } from '@widgets/NewsCardSidebar/index.js';
import { VideoAdPlayer } from '@widgets/VideoAdPlayer/index.js';

export const Sidebar = React.memo(({ newsList, categories }) => {

    const memoizedGroupedNews = useMemo(() => {
        return newsList.reduce((acc, news) => {
            if (!acc[news.categoryId]) {
                acc[news.categoryId] = [];
            }
            acc[news.categoryId].push(news);
            return acc;
        }, {});
    }, [newsList]);

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


    return (
        <div className={styles.sidebar}>
            <p>Рекламная служба ГТРК "Ингушетия" - 8928-793-47-86
            </p>
            <VideoAdPlayer />
            {categories.map((category) => {
                const categoryNews = memoizedGroupedNews[category.id] || [];
                const shuffledNews = shuffleArray(categoryNews).slice(0, 3);

                return (
                    <div key={category.id} className={styles.categorySection}>
                        <ul className={styles.newsList}>
                            {shuffledNews.map((item) => (
                                <NewsCardSidebar key={item.id} item={item} />
                            ))}
                        </ul>
                    </div>
                );
            })}
            <div className={styles.listedNewsContainer}>
                <ListedNews newsList={newsList} />
            </div>
        </div>
    );
});
