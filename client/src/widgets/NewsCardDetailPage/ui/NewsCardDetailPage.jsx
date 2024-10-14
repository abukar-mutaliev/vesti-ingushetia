import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';
import styles from './NewsCardDetailPage.module.scss';
import defaultImage from '@assets/default.jpg';

export const NewsCardDetailPage = React.memo(({ news }) => {
    const { title, createdAt, mediaFiles, id } = news;
    const [mediaError, setMediaError] = useState(false);

    const mediaElement = useMemo(() => {
        const image = mediaFiles?.find((media) => media.type === 'image');
        const video = mediaFiles?.find((media) => media.type === 'video');
        const imageUrl = image ? `http://localhost:5000/${image.url}` : null;
        const videoUrl = video
            ? `http://localhost:5000/${video.url}#t=0.5`
            : null;

        if (imageUrl && !mediaError) {
            return (
                <img
                    src={imageUrl}
                    alt={title}
                    className={styles.newsImage}
                    onError={() => setMediaError(true)}
                />
            );
        }
        if (videoUrl && !mediaError) {
            return (
                <video
                    className={styles.newsImage}
                    src={videoUrl}
                    preload="metadata"
                    muted
                    onError={() => setMediaError(true)}
                />
            );
        }
        return (
            <img src={defaultImage} alt={title} className={styles.newsImage} />
        );
    }, [mediaFiles, mediaError]);

    return (
        <div className={styles.NewsCardDetailPage}>
            <Link to={`/news/${id}`} className={styles.newsLink}>
                {mediaElement}
                {mediaFiles.some((media) => media.type === 'video') &&
                    !mediaError && (
                        <div className={styles.playButton}>
                            <FaPlayCircle size={50} />
                        </div>
                    )}
                <div className={styles.newsContent}>
                    <h3 className={styles.newsTitle}>{title}</h3>
                    <p className={styles.newsDate}>
                        {new Date(createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>
            </Link>
        </div>
    );
});
