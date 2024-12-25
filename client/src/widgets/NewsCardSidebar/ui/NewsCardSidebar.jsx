import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './NewsCard.module.scss';
import { truncateHtmlToSentences } from '@shared/lib/TruncateHtml/truncateHtml.js';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement';
import { FaPlayCircle } from 'react-icons/fa';

export const NewsCardSidebar = React.memo(({ item }) => {
    const videoMedia = useMemo(() => {
        return item.mediaFiles?.find((media) => media.type === 'video') || null;
    }, [item.mediaFiles]);

    const imageMedia = useMemo(() => {
        return item.mediaFiles?.find((media) => media.type === 'image') || null;
    }, [item.mediaFiles]);

    const mediaElement = useMemo(() => (
        <Link to={`/news/${item.id}`} className={styles.newsLink}>
            <div className={styles.videoContainer}>
                <MediaElement
                    imageUrl={imageMedia?.url}
                    videoUrl={videoMedia?.url}
                    alt={item.title}
                    className={styles.newsImage}
                    playIconSize={30}
                    showPlayIcon={!!videoMedia}
                />

            </div>
        </Link>
    ), [item.id, item.title, imageMedia, videoMedia]);

    return (
        <li className={styles.newsItem}>
            {mediaElement}
            <div className={styles.newsOverlay}>
                <p className={styles.newsTitle}>
                    {truncateHtmlToSentences(item.title, 1)}
                </p>
            </div>
        </li>
    );
});