import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './ListedNews.module.scss';
import defaultImage from '@assets/default.jpg';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement.jsx';

export const ListedNews = React.memo(({ newsList }) => {

    const sortedByViewsNews = useMemo(() => {
        return [...newsList]
        .sort((a, b) => b.views - a.views)
        .slice(0, 6);
    }, [newsList]);

    const topThreeNews = useMemo(() => {
        return sortedByViewsNews.slice(0, 3).map((newsItem) => {
            const imageMedia = newsItem.mediaFiles?.find(media => media.type === 'image') || null;
            const videoMedia = newsItem.mediaFiles?.find(media => media.type === 'video') || null;

            const imageUrl = imageMedia?.url || null;
            const videoUrl = videoMedia?.url || null;

            return {
                id: newsItem.id,
                title: newsItem.title,
                imageUrl,
                videoUrl,
                alt: newsItem.title,
            };
        });
    }, [sortedByViewsNews]);


    const nextThreeNews = useMemo(() => {
        return sortedByViewsNews.slice(3, 6).map((newsItem) => ({
            id: newsItem.id,
            title: newsItem.title,
        }));
    }, [sortedByViewsNews]);

    return (
        <div className={styles.listedNews}>
            <h2>ПОПУЛЯРНОЕ</h2>
            <hr />
            <div className={styles.smallImageNewsSection}>
                {topThreeNews.map((newsItem) => {
                    const handleImageError = (e) => {
                        e.target.onerror = null;
                        e.target.src = defaultImage;
                    };

                    return (
                        <Link
                            key={newsItem.id}
                            to={`/news/${newsItem.id}`}
                            className={styles.smallImageNewsLink}
                        >
                            <div className={styles.smallImageNewsItem}>
                                <MediaElement
                                    imageUrl={newsItem.imageUrl}
                                    videoUrl={newsItem.videoUrl}
                                    alt={newsItem.alt}
                                    className={styles.mediaElement}
                                    playIconSize={30}
                                    onError={handleImageError}
                                />
                                <p className={styles.smallImageNewsTitle}>
                                    {newsItem.title}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
            <ul className={styles.listedNewsSection}>
                {nextThreeNews.map((newsItem) => (
                    <Link
                        key={newsItem.id}
                        to={`/news/${newsItem.id}`}
                        className={styles.listedNewsLink}
                    >
                        <li className={styles.listedNewsItem}>
                            {newsItem.title}
                        </li>
                    </Link>
                ))}
            </ul>
            <div className={styles.viewAllNewsButton}>
                <Link to="/news" className={styles.viewAllLink}>
                    Все новости
                </Link>
            </div>
        </div>
    );
});
