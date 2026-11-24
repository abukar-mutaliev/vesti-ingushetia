import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import defaultImage from '@assets/default.jpg';
import styles from './NewsCardDetailPage.module.scss';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement.jsx';
import { getNewsPreviewImage } from '@shared/lib/getNewsPreviewImage/getNewsPreviewImage.js';

export const NewsCardDetailPage = memo(({ news }) => {
    const { title, createdAt, mediaFiles, id } = news;

    const videoMedia = useMemo(() => {
        return mediaFiles?.find((media) => media.type === 'video') || null;
    }, [mediaFiles]);

    const imageMedia = useMemo(() => {
        return getNewsPreviewImage(mediaFiles);
    }, [mediaFiles]);

    const imageUrl = useMemo(() => {
        return imageMedia?.url || defaultImage;
    }, [imageMedia]);

    return (
        <div className={styles.newsCardDetailPage}>
            <Link to={`/news/${id}`} className={styles.newsLink}>
                <MediaElement
                    imageUrl={imageUrl}
                    videoUrl={videoMedia?.url || null}
                    alt={title}
                    className={styles.mediaElement}
                    playIconSize={50}
                />
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
