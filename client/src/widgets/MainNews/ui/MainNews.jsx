import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import styles from './MainNews.module.scss';
import { Link } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';
import { selectLatestNews } from '@entities/news/model/newsSelectors';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import DOMPurify from 'dompurify';

export const MainNews = React.memo(() => {
    const latestNews = useSelector(selectLatestNews, shallowEqual);

    if (!latestNews) {
        return <div className={styles.mainNews}>Новостей нет</div>;
    }

    const imageUrl = latestNews.mediaFiles?.find(
        (media) => media.type === 'image',
    )?.url;
    const videoUrl = latestNews.mediaFiles?.find(
        (media) => media.type === 'video',
    )?.url;

    const rawContent =
        latestNews.content.split('. ').slice(0, 2).join('. ') + '.';

    let sanitizedContent = DOMPurify.sanitize(rawContent);

    let highlightedContent = highlightKeywordsInHtml(sanitizedContent, '');

    highlightedContent = DOMPurify.sanitize(highlightedContent);

    return (
        <div className={styles.mainNewsContainer}>
            <div className={styles.mainNews}>
                <Link
                    to={`/news/${latestNews.id}`}
                    className={styles.mainNewsLink}
                >
                    {imageUrl ? (
                        <div className={styles.imageWrapper}>
                            <img
                                src={`${imageUrl}`}
                                alt={latestNews.title}
                                className={styles.mainNewsImage}
                            />
                            {videoUrl && (
                                <div className={styles.playButton}>
                                    <FaPlayCircle size={70} />
                                </div>
                            )}
                        </div>
                    ) : (
                        videoUrl && (
                            <div className={styles.videoWrapper}>
                                <video
                                    src={`${videoUrl}`}
                                    className={styles.mainNewsVideo}
                                    preload="metadata"
                                />
                                <div className={styles.playButton}>
                                    <FaPlayCircle size={70} />
                                </div>
                            </div>
                        )
                    )}
                </Link>
                <div className={styles.mainNewsContent}>
                    <h2 className={styles.mainNewsTitle}>
                        <Link
                            to={`/news/${latestNews.id}`}
                            className={styles.mainNewsTitleLink}
                        >
                            {latestNews.title}
                        </Link>
                    </h2>
                    <div
                        className={styles.mainNewsDescription}
                        dangerouslySetInnerHTML={{ __html: highlightedContent }}
                    />
                    <Link
                        to={`/news/${latestNews.id}`}
                        className={styles.readMoreButton}
                    >
                        Читать полностью
                    </Link>
                </div>
            </div>
        </div>
    );
});
