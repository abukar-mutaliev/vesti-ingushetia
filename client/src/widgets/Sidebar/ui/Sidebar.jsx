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
        return (
            <div className={styles.sidebarEmpty}>
                Нет доступных категорий для отображения
            </div>
        );
    }

    return (
        <aside className={styles.sidebar}>
            <section className={styles.block}>
                <div className={styles.blockHeader}>
                    <span className={styles.liveBadge}>
                        <span className={styles.liveDot} />
                        В эфире
                    </span>
                    <h3 className={styles.blockTitle}>Прямая трансляция</h3>
                </div>
                <LiveStreamWidget />
            </section>

            <section className={`${styles.block} ${styles.adBlock}`}>
                <p className={styles.adLabel}>Реклама</p>
                <p className={styles.adPhone}>
                    Рекламная служба ГТРК «Ингушетия»
                    <a href="tel:+79287934786">8 928 793-47-86</a>
                </p>
                <VideoAdPlayer />
            </section>

            {showElectionsBanner && (
                <section className={styles.block}>
                    <ElectionsBannerWidget />
                </section>
            )}

            {categoryList.map((category) => {
                const categoryNews = memoizedGroupedNews[category.id] || [];
                if (categoryNews.length === 0) return null;

                return (
                    <section key={category.id} className={styles.categorySection}>
                        <div className={styles.blockHeader}>
                            <h3 className={styles.blockTitle}>{category.name}</h3>
                        </div>
                        <ul className={styles.newsList}>
                            {categoryNews.slice(0, 3).map((item, index) => (
                                <NewsCardSidebar
                                    key={item.id}
                                    item={item}
                                    featured={index === 0}
                                />
                            ))}
                        </ul>
                    </section>
                );
            })}

            <div className={styles.listedNewsContainer}>
                <ListedNews newsList={newsList} />
            </div>
        </aside>
    );
});
