import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styles from './NewsCard.module.scss';
import { truncateHtmlToSentences } from '@shared/lib/TruncateHtml/truncateHtml.js';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement';
import { getNewsPreviewImage } from '@shared/lib/getNewsPreviewImage/getNewsPreviewImage.js';

export const NewsCardSidebar = React.memo(({ item, featured = false }) => {
    const videoMedia = useMemo(() => {
        return item.mediaFiles?.find((media) => media.type === 'video') || null;
    }, [item.mediaFiles]);

    const imageMedia = useMemo(() => {
        return getNewsPreviewImage(item.mediaFiles);
    }, [item.mediaFiles]);

    return (
        <li
            className={`${styles.newsItem} ${featured ? styles.featured : ''}`}
        >
            <Link to={`/news/${item.id}`} className={styles.newsLink}>
                <div className={styles.mediaWrap}>
                    <MediaElement
                        imageUrl={imageMedia?.url}
                        videoUrl={videoMedia?.url}
                        alt={item.title}
                        className={styles.newsImage}
                        playIconSize={featured ? 42 : 28}
                        showPlayIcon={!!videoMedia}
                    />
                </div>
                <div className={styles.newsOverlay}>
                    <p className={styles.newsTitle}>
                        {truncateHtmlToSentences(item.title, 1)}
                    </p>
                </div>
            </Link>
        </li>
    );
});

NewsCardSidebar.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        title: PropTypes.string.isRequired,
        mediaFiles: PropTypes.array,
    }).isRequired,
    featured: PropTypes.bool,
};
