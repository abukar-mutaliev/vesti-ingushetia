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

    const getVideoPoster = () => {
        const videoMedia = latestNews.mediaFiles?.find(
            (media) => media.type === 'video'
        );

        if (videoMedia && videoMedia.poster) {
            return videoMedia.poster.url;
        }

        return null;
    };

    const getFirstImage = () => {
        const imageMedia = latestNews.mediaFiles?.find(
            (media) => media.type === 'image'
        );
        return imageMedia ? imageMedia.url : null;
    };

    const posterUrl = getVideoPoster();
    const imageUrl = getFirstImage();

    const rawContent =
        latestNews.content.split('. ').slice(0, 2).join('. ') + '.';

    let sanitizedContent = DOMPurify.sanitize(rawContent);

    let highlightedContent = highlightKeywordsInHtml(sanitizedContent, '');

    highlightedContent = DOMPurify.sanitize(highlightedContent);

    return (
        <div className={styles.mainNewsContainer}>

            <Link className={styles.mainNews}
                  to={`/news/${latestNews.id}`}
            >
                <div

                    className={styles.mainNewsLink}
                >
                    {posterUrl ? (
                        <div className={styles.imageWrapper}>
                            <img
                                src={posterUrl}
                                alt={latestNews.title}
                                className={styles.mainNewsImage}
                            />
                            <div className={styles.playButton}>
                                <FaPlayCircle size={70} />
                            </div>
                        </div>
                    ) : imageUrl ? (
                        <div className={styles.imageWrapper}>
                            <img
                                src={imageUrl}
                                alt={latestNews.title}
                                className={styles.mainNewsImage}
                            />
                            {latestNews.mediaFiles?.some(
                                (media) => media.type === 'video'
                            ) && (
                                <div className={styles.playButton}>
                                    <FaPlayCircle size={70} />
                                </div>
                            )}
                        </div>
                    ) : latestNews.mediaFiles?.some(
                        (media) => media.type === 'video'
                    ) ? (
                        <div className={styles.videoWrapper}>
                            <video
                                src={latestNews.mediaFiles.find(
                                    (media) => media.type === 'video'
                                ).url}
                                className={styles.mainNewsVideo}
                                preload="metadata"
                            />
                            <div className={styles.playButton}>
                                <FaPlayCircle size={70} />
                            </div>
                        </div>
                    ) : (
                        <div className={styles.placeholder}>
                            <FaPlayCircle size={70} />
                        </div>
                    )}
                </div>
                <div className={styles.mainNewsContent}>
                    <h2 className={styles.mainNewsTitle}>
                        <div
                            to={`/news/${latestNews.id}`}
                            className={styles.mainNewsTitleLink}
                        >
                            {latestNews.title}
                        </div>
                    </h2>
                    <div
                        className={styles.mainNewsDescription}
                        dangerouslySetInnerHTML={{ __html: highlightedContent }}
                    />
                    <div
                        to={`/news/${latestNews.id}`}
                        className={styles.readMoreButton}
                    >
                        Читать полностью
                    </div>
                </div>
            </Link>
        </div>
    );
});
