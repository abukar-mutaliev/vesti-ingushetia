import React, { useMemo } from 'react';
import styles from './ListedNews.module.scss';
import { Link } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';

export const ListedNews = React.memo(({ newsList }) => {
    const sortedByViewsNews = useMemo(() => {
        return [...newsList].sort((a, b) => b.views - a.views).slice(0, 6);
    }, [newsList]);

    const topViewedNews = sortedByViewsNews.slice(0, 6);

    return (
        <div className={styles.listedNews}>
            <h2>ПОПУЛЯРНОЕ</h2>
            <hr />
            <div className={styles.smallImageNewsSection}>
                {topViewedNews.slice(0, 3).map((newsItem) => {
                    const imageUrl =
                        newsItem.mediaFiles?.find(
                            (media) => media.type === 'image',
                        )?.url || null;
                    const videoUrl =
                        newsItem.mediaFiles?.find(
                            (media) => media.type === 'video',
                        )?.url || null;
                    const hasVideo = Boolean(videoUrl);

                    let mediaElement;

                    if (imageUrl) {
                        mediaElement = (
                            <img
                                src={`${imageUrl}`}
                                alt={newsItem.title}
                                className={styles.smallImageNewsImage}
                            />
                        );
                    } else if (hasVideo) {
                        mediaElement = (
                            <div className={styles.imageContainer}>
                                <img
                                    src={defaultImage}
                                    alt={newsItem.title}
                                    className={styles.smallImageNewsImage}
                                />
                                <div className={styles.playButton}>
                                    <FaPlayCircle size={30} />
                                </div>
                            </div>
                        );
                    } else {
                        mediaElement = (
                            <img
                                src={defaultImage}
                                alt={newsItem.title}
                                className={styles.smallImageNewsImage}
                            />
                        );
                    }

                    return (
                        <Link
                            key={newsItem.id}
                            to={`/news/${newsItem.id}`}
                            className={styles.smallImageNewsLink}
                        >
                            <div className={styles.smallImageNewsItem}>
                                {mediaElement}
                                <p className={styles.smallImageNewsTitle}>
                                    {newsItem.title}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
            <ul className={styles.listedNewsSection}>
                {topViewedNews.slice(3, 6).map((newsItem) => (
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
