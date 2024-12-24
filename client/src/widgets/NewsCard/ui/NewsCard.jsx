import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './NewsCard.module.scss';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import { truncateHtmlToSentences } from '@shared/lib/TruncateHtml/truncateHtml.js';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement';

export const NewsCard = React.memo(
    ({ news, showDate, showContent, keywords = '' }) => {
        const formattedDate = useMemo(() => {
            return new Date(news.createdAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        }, [news.createdAt]);

        const imageMedia = useMemo(() => {
            return news.mediaFiles?.find((media) => media.type === 'image') || null;
        }, [news.mediaFiles]);

        const videoMedia = useMemo(() => {
            return news.mediaFiles?.find((media) => media.type === 'video') || null;
        }, [news.mediaFiles]);

        const mediaElement = useMemo(() => (
            <Link
                to={`/news/${news.id}`}
                state={{ id: news.id }}
                className={styles.imageLink}
            >
                <div className={styles.videoWrapper}>
                    <MediaElement
                        imageUrl={imageMedia?.url}
                        videoUrl={videoMedia?.url}
                        alt={news.title}
                        className={styles.newsImage}
                        playIconSize={50}
                        showPlayIcon={!!videoMedia}
                    />
                </div>
            </Link>
        ), [news.id, news.title, imageMedia, videoMedia]);

        const processedContent = useMemo(() => {
            let contentToProcess;
            if (showContent) {
                contentToProcess = news.content;
            } else {
                contentToProcess = truncateHtmlToSentences(news.content, 1);
            }
            return highlightKeywordsInHtml(contentToProcess, keywords);
        }, [news.content, showContent, keywords]);

        const processedTitle = useMemo(() => {
            const titleToProcess = news.title;
            return highlightKeywordsInHtml(titleToProcess, keywords);
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
                        />
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