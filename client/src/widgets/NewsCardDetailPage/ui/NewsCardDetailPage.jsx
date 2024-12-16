import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';
import styles from './NewsCardDetailPage.module.scss';

export const NewsCardDetailPage = React.memo(({ news }) => {
    const { title, createdAt, mediaFiles, id } = news;

    const videoMedia = useMemo(() => {
        return mediaFiles?.find((media) => media.type === 'video') || null;
    }, [mediaFiles]);

    const imageMedia = useMemo(() => {
        return mediaFiles?.find((media) => media.type === 'image') || null;
    }, [mediaFiles]);

    const imageUrl = useMemo(() => {
        return imageMedia?.url || defaultImage;
    }, [imageMedia]);

    const mediaElement = useMemo(() => {
        return (
            <Link to={`/news/${id}`} className={styles.newsLink}>
                <div className={styles.mediaContainer}>
                    <img
                        src={imageUrl}
                        alt={title}
                        className={styles.newsImage}
                        loading="lazy"
                    />
                    {videoMedia && (
                        <div className={styles.playButton}>
                            <FaPlayCircle size={50} />
                        </div>
                    )}
                </div>
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
        );
    }, [videoMedia, imageUrl, id, title, createdAt]);

    return (
        <div className={styles.newsCardDetailPage}>
            {mediaElement}
        </div>
    );
});
