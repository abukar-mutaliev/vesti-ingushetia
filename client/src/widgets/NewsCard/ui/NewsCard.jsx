import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './NewsCard.module.scss';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import { truncateHtmlToSentences } from '@shared/lib/TruncateHtml/truncateHtml.js';
import { getVideoThumbnailUrl } from '@shared/lib/getVideoThumbnailUrl/getVideoThumbnailUrl.js';

export const NewsCard = React.memo(
    ({ news, showDate, showContent, keywords = '' }) => {
        const [imageError, setImageError] = useState(false);
        const [posterError, setPosterError] = useState(false);

        const formattedDate = useMemo(() => {
            return new Date(news.createdAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        }, [news.createdAt]);

        const imageMedia = useMemo(() => {
            return (
                news.mediaFiles?.find((media) => media.type === 'image') || null
            );
        }, [news.mediaFiles]);

        const videoMedia = useMemo(() => {
            return (
                news.mediaFiles?.find((media) => media.type === 'video') || null
            );
        }, [news.mediaFiles]);

        const videoPosterUrl = useMemo(() => {
            return (
                videoMedia?.poster?.url ||
                getVideoThumbnailUrl(videoMedia?.url) ||
                null
            );
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
                    <Link
                        to={`/news/${news.id}`}
                        state={{ id: news.id }}
                        className={styles.imageLink}
                    >
                        <div className={styles.videoWrapper}>
                            <img
                                src={videoPosterUrl}
                                alt={news.title}
                                className={styles.newsImage}
                                onError={() => setPosterError(true)}
                            />
                            <div className={styles.playButton}>
                                <FaPlayCircle size={50} />
                            </div>
                        </div>
                    </Link>
                );
            } else if (hasImage) {
                return (
                    <Link
                        to={`/news/${news.id}`}
                        state={{ id: news.id }}
                        className={styles.imageLink}
                    >
                        <div className={styles.videoWrapper}>
                            <img
                                src={imageUrl}
                                alt={news.title}
                                className={styles.newsImage}
                                onError={() => setImageError(true)}
                            />
                            {videoMedia && (
                                <div className={styles.playButton}>
                                    <FaPlayCircle size={50} />
                                </div>
                            )}
                        </div>
                    </Link>
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
            hasVideoWithPoster,
            videoPosterUrl,
            news.id,
            news.title,
            hasImage,
            imageUrl,
            videoMedia,
        ]);

        const processedContent = useMemo(() => {
            let contentToProcess;
            if (showContent) {
                contentToProcess = news.content;
            } else {
                contentToProcess = truncateHtmlToSentences(news.content, 1);
            }

            const highlightedContent = highlightKeywordsInHtml(
                contentToProcess,
                keywords,
            );

            return highlightedContent;
        }, [news.content, showContent, keywords]);

        const processedTitle = useMemo(() => {
            const titleToProcess = news.title;
            const highlightedTitle = highlightKeywordsInHtml(
                titleToProcess,
                keywords,
            );


            return highlightedTitle;
        }, [news.title, keywords]);

        return (
            <div className={styles.newsCard}>
                {mediaElement}
                <div className={styles.textContent}>
                    <Link
                        to={`/news/${news.id}`}
                        className={styles.link}
                        state={{ id: news.id }}
                    >
                        <h2
                            className={styles.title}
                            dangerouslySetInnerHTML={{
                                __html: processedTitle,
                            }}
                        ></h2>
                        <div
                            className={styles.content}
                            dangerouslySetInnerHTML={{
                                __html: processedContent,
                            }}
                        />
                        {showDate && (
                            <span className={styles.date}>{formattedDate}</span>
                        )}
                        <span className={styles.readMoreButton}>
                            Читать полностью
                        </span>
                    </Link>
                </div>
            </div>
        );
    },
);
