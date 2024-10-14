import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';
import styles from './NewsCard.module.scss';

export const NewsCardSidebar = React.memo(({ item }) => {
    const video = item.mediaFiles?.find((media) => media.type === 'video');
    const image = item.mediaFiles?.find((media) => media.type === 'image');
    const hasVideo = Boolean(video);

    return (
        <li className={styles.newsItem}>
            <Link to={`/news/${item.id}`} className={styles.newsLink}>
                {image ? (
                    <img
                        src={`http://localhost:5000/${image.url}`}
                        alt={item.title}
                        className={styles.newsImage}
                    />
                ) : hasVideo ? (
                    <div className={styles.videoContainer}>
                        <video
                            src={`http://localhost:5000/${video.url}`}
                            className={styles.newsImage}
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                                e.target.currentTime = 0;
                                e.target.pause();
                            }}
                        />
                        <div className={styles.playButton}>
                            <FaPlayCircle size={50} />
                        </div>
                    </div>
                ) : (
                    <img
                        src={defaultImage}
                        alt={item.title}
                        className={styles.newsImage}
                    />
                )}

                {hasVideo && (
                    <div className={styles.playButton}>
                        <FaPlayCircle size={50} />
                    </div>
                )}

                <div className={styles.newsOverlay}>
                    <p className={styles.newsTitle}>{item.title}</p>
                </div>
            </Link>
        </li>
    );
});
