import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';
import styles from './NewsCard.module.scss';
import { getVideoThumbnailUrl } from '@shared/lib/getVideoThumbnailUrl/getVideoThumbnailUrl.js';

export const NewsCardSidebar = React.memo(({ item }) => {
    const [posterError, setPosterError] = useState(false);
    const [imageError, setImageError] = useState(false);

    const videoMedia = useMemo(() => {
        return item.mediaFiles?.find((media) => media.type === 'video') || null;
    }, [item.mediaFiles]);

    const imageMedia = useMemo(() => {
        return item.mediaFiles?.find((media) => media.type === 'image') || null;
    }, [item.mediaFiles]);

    const videoPosterUrl = useMemo(() => {
        return videoMedia?.poster?.url || getVideoThumbnailUrl(videoMedia?.url) || null;
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
                <Link to={`/news/${item.id}`} className={styles.newsLink}>
                    <div className={styles.videoContainer}>
                        <img
                            src={videoPosterUrl}
                            alt={item.title}
                            className={styles.newsImage}
                            onError={() => setPosterError(true)}
                            loading="lazy"
                        />
                        <div className={styles.playButton}>
                            <FaPlayCircle size={30} />
                        </div>
                    </div>
                </Link>
            );
        } else if (hasImage) {
            return (
                <Link to={`/news/${item.id}`} className={styles.newsLink}>
                    <div className={styles.videoContainer}>
                        <img
                            src={imageUrl}
                            alt={item.title}
                            className={styles.newsImage}
                            onError={() => setImageError(true)}
                            loading="lazy"
                        />
                        {videoMedia && (
                            <div className={styles.playButton}>
                                <FaPlayCircle size={30} />
                            </div>
                        )}
                    </div>
                </Link>
            );
        } else {
            return (
                <Link to={`/news/${item.id}`} className={styles.newsLink}>
                    <img
                        src={defaultImage}
                        alt={item.title}
                        className={styles.newsImage}
                        loading="lazy"
                    />
                </Link>
            );
        }
    }, [
        hasVideoWithPoster,
        videoPosterUrl,
        item.id,
        item.title,
        hasImage,
        imageUrl,
        videoMedia,
    ]);

    return (
        <li className={styles.newsItem}>
            {mediaElement}
            <div className={styles.newsOverlay}>
                <p className={styles.newsTitle}>{item.title}</p>
            </div>
        </li>
    );
});
