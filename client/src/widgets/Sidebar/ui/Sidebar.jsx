import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styles from './Sidebar.module.scss';
import { ListedNews } from '../../ListedNews/';
import { NewsCardSidebar } from '@widgets/NewsCardSidebar/index.js';
import { VideoAdPlayer } from '@widgets/VideoAdPlayer/index.js';
import { ElectionsBannerWidget } from '@widgets/ElectionsBannerWidget/index.js';
import { selectRandomizedNewsList } from '@entities/news/model/newsSelectors.js';
import { LiveStreamWidget } from '@widgets/LiveStreamWidget/index.js';

export const Sidebar = React.memo(({ categories, showElectionsBanner = false }) => {
    const randomizedNewsList = useSelector(selectRandomizedNewsList);
    const categoryList = Array.isArray(categories) ? categories : [];
    const newsList = Array.isArray(randomizedNewsList) ? randomizedNewsList : [];

    const memoizedGroupedNews = useMemo(() => {
        return newsList.reduce((acc, newsItem) => {
            const itemCategories = Array.isArray(newsItem?.categories)
                ? newsItem.categories
                : [];
            if (itemCategories.length === 0) {
                return acc;
            }
            itemCategories.forEach((category) => {
                if (!acc[category.id]) {
                    acc[category.id] = [];
                }
                acc[category.id].push(newsItem);
            });

            return acc;
        }, {});
    }, [newsList]);

    if (categoryList.length === 0) {
        return <p>Нет доступных категорий для отображения</p>;
    }

    return (
        <div className={styles.sidebar}>
            <LiveStreamWidget />
            <p>Рекламная служба ГТРК "Ингушетия" - 8928-793-47-86</p>
            <VideoAdPlayer />
            {showElectionsBanner && <ElectionsBannerWidget />}

            {categoryList.map((category) => {
                const categoryNews = memoizedGroupedNews[category.id] || [];
                if (categoryNews.length === 0) return null;

                return (
                    <div key={category.id} className={styles.categorySection}>
                        <ul className={styles.newsList}>
                            {categoryNews.slice(0, 3).map((item) => (
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
