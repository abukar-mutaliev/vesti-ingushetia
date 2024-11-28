import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './NewsCard.module.scss';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import DOMPurify from 'dompurify';

export const NewsCard = React.memo(
    ({ news, showDate, showContent, keywords = '' }) => {
        const [imageError, setImageError] = useState(false);
        const [videoError, setVideoError] = useState(false);

        const formattedDate = useMemo(() => {
            return new Date(news.createdAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        }, [news.createdAt]);

        const imageUrl = useMemo(() => {
            return (
                news.mediaFiles?.find((media) => media.type === 'image')?.url ||
                null
            );
        }, [news.mediaFiles]);

        const videoUrl = useMemo(() => {
            return (
                news.mediaFiles?.find((media) => media.type === 'video')?.url ||
                null
            );
        }, [news.mediaFiles]);

        const hasVideo = useMemo(
            () => Boolean(videoUrl && !videoError),
            [videoUrl, videoError],
        );

        const mediaElement = useMemo(() => {
            if (imageUrl && !imageError) {
                return (
                    <Link
                        to={`/news/${news.id}`}
                        state={{ id: news.id }}
                        className={styles.imageLink}
                    >
                        <div className={styles.videoWrapper}>
                            <img
                                src={`${imageUrl}`}
                                alt={news.title}
                                className={styles.newsImage}
                                onError={() => setImageError(true)}
                            />
                            {hasVideo && (
                                <div className={styles.playButton}>
                                    <FaPlayCircle size={50} />
                                </div>
                            )}
                        </div>
                    </Link>
                );
            } else if (videoUrl && !videoError) {
                return (
                    <div className={styles.videoContainer}>
                        <Link to={`/news/${news.id}`} state={{ id: news.id }}>
                            <div className={styles.videoWrapper}>
                                <video
                                    className={styles.newsVideo}
                                    src={`${videoUrl}`}
                                    controls={false}
                                    muted
                                    preload="metadata"
                                    onError={() => setVideoError(true)}
                                    onLoadedMetadata={(e) => {
                                        e.target.currentTime = 0;
                                        e.target.pause();
                                    }}
                                />
                            </div>
                            <div className={styles.playButtonOverlay}>
                                <FaPlayCircle size={50} />
                            </div>
                        </Link>
                    </div>
                );
            } else {
                return (
                    <Link
                        to={`/news/${news.id}`}
                        state={{ id: news.id }}
                        className={styles.imageLink}
                    >
                        <img
                            src={defaultImage}
                            alt={news.title}
                            className={styles.newsImage}
                        />
                    </Link>
                );
            }
        }, [
            imageUrl,
            videoUrl,
            imageError,
            videoError,
            hasVideo,
            news.id,
            news.title,
        ]);

        const processedContent = useMemo(() => {
            let contentToProcess;
            if (showContent) {
                contentToProcess = news.content;
            } else {
                contentToProcess =
                    news.content.split('. ').slice(0, 1).join('. ') + '.';
            }

            let sanitizedContent = DOMPurify.sanitize(contentToProcess);

            let highlightedContent = highlightKeywordsInHtml(
                sanitizedContent,
                keywords,
            );

            highlightedContent = DOMPurify.sanitize(highlightedContent);

            return highlightedContent;
        }, [news.content, showContent, keywords]);

        return (
            <div className={styles.newsCard}>
                {mediaElement}
                <div className={styles.textContent}>
                    <Link
                        to={`/news/${news.id}`}
                        className={styles.link}
                        state={{ id: news.id }}
                    >
                        <h2 className={styles.title}>{news.title}</h2>
                        <div
                            className={styles.content}
                            dangerouslySetInnerHTML={{
                                __html: processedContent,
                            }}
                        />
                        {showDate && (
                            <span className={styles.date}>{formattedDate}</span>
                        )}
                        <button className={styles.readMoreButton}>
                            Читать полностью
                        </button>
                    </Link>
                </div>
            </div>
        );
    },
);
