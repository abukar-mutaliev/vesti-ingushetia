import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styles from './Sidebar.module.scss';
import { ListedNews } from '../../ListedNews/';
import { NewsCardSidebar } from '@widgets/NewsCardSidebar/index.js';
import { VideoAdPlayer } from '@widgets/VideoAdPlayer/index.js';
import { selectRandomizedNewsList } from '@entities/news/model/newsSelectors.js';

export const Sidebar = React.memo(({ categories }) => {
    const randomizedNewsList = useSelector(selectRandomizedNewsList);

    const memoizedGroupedNews = useMemo(() => {
        return randomizedNewsList.reduce((acc, news) => {
            if (!acc[news.categoryId]) {
                acc[news.categoryId] = [];
            }
            acc[news.categoryId].push(news);
            return acc;
        }, {});
    }, [randomizedNewsList]);

    if (!categories || !categories.length) {
        return <p>Нет доступных категорий для отображения</p>;
    }

    return (
        <div className={styles.sidebar}>
            <p>Рекламная служба ГТРК "Ингушетия" - 8928-793-47-86</p>
            <VideoAdPlayer />

            {categories.map((category) => {
                const categoryNews = memoizedGroupedNews[category.id] || [];
                if (categoryNews.length === 0) return null;

                return (
                    <div key={category.id} className={styles.categorySection}>
                        <h3>{category.name}</h3>
                        <ul className={styles.newsList}>
                            {categoryNews.slice(0, 3).map((item) => (
                                <NewsCardSidebar key={item.id} item={item} />
                            ))}
                        </ul>
                    </div>
                );
            })}

            <div className={styles.listedNewsContainer}>
                <ListedNews newsList={randomizedNewsList} />
            </div>
        </div>
    );
});
