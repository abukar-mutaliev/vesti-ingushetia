import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';
import styles from './NewsCardDetailPage.module.scss';

export const NewsCardDetailPage = React.memo(({ news }) => {
    const { title, createdAt, mediaFiles, id } = news;
    const [posterError, setPosterError] = useState(false);
    const [imageError, setImageError] = useState(false);

    const videoMedia = useMemo(() => {
        return mediaFiles?.find((media) => media.type === 'video') || null;
    }, [mediaFiles]);

    const imageMedia = useMemo(() => {
        return mediaFiles?.find((media) => media.type === 'image') || null;
    }, [mediaFiles]);

    const videoPosterUrl = useMemo(() => {
        return videoMedia?.poster?.url || null;
    }, [videoMedia]);

    const imageUrl = useMemo(() => {
        return imageMedia?.url || null;
    }, [imageMedia]);

    const hasVideoWithPoster = useMemo(
        () => Boolean(videoMedia && videoPosterUrl && !posterError),
        [videoMedia, videoPosterUrl, posterError],
    );

    const hasImage = useMemo(
        () => Boolean(imageUrl && !imageError),
        [imageUrl, imageError],
    );

    const mediaElement = useMemo(() => {
        if (hasVideoWithPoster) {
            return (
                <Link to={`/news/${id}`} className={styles.newsLink}>
                    <div className={styles.mediaContainer}>
                        <img
                            src={videoPosterUrl}
                            alt={title}
                            className={styles.newsImage}
                            onError={() => setPosterError(true)}
                            loading="lazy"
                        />
                        <div className={styles.playButton}>
                            <FaPlayCircle size={50}/>
                        </div>
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
        } else if (hasImage) {
            return (
                <Link to={`/news/${id}`} className={styles.newsLink}>
                    <div className={styles.mediaContainer}>
                        <img
                            src={imageUrl}
                            alt={title}
                            className={styles.newsImage}
                            onError={() => setImageError(true)}
                            loading="lazy"
                        />
                        {videoMedia && (
                            <div className={styles.playButton}>
                                <FaPlayCircle size={50}/>
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
        } else {
            return (
                <Link to={`/news/${id}`} className={styles.newsLink}>
                    <div className={styles.mediaContainer}>
                        <img
                            src={defaultImage}
                            alt={title}
                            className={styles.newsImage}
                            loading="lazy"
                        />
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
        }
    }, [
        hasVideoWithPoster,
        videoPosterUrl,
        id,
        title,
        hasImage,
        imageUrl,
        videoMedia,
    ]);

    return (
        <div className={styles.newsCardDetailPage}>
            {mediaElement}
        </div>
    );
});
