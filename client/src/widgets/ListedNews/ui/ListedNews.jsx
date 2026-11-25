import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './ListedNews.module.scss';
import defaultImage from '@assets/default.jpg';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement.jsx';
import { getNewsPreviewImage } from '@shared/lib/getNewsPreviewImage/getNewsPreviewImage.js';

export const ListedNews = React.memo(({ newsList }) => {
    const popularNews = useMemo(() => {
        const items = Array.isArray(newsList) ? newsList : [];

        return [...items]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 6)
            .map((newsItem) => {
                const imageMedia = getNewsPreviewImage(newsItem.mediaFiles);
                const videoMedia =
                    newsItem.mediaFiles?.find((media) => media.type === 'video') ||
                    null;

                return {
                    id: newsItem.id,
                    title: newsItem.title,
                    imageUrl: imageMedia?.url || null,
                    videoUrl: videoMedia?.url || null,
                };
            });
    }, [newsList]);

    const [lead, ...rest] = popularNews;

    if (!lead) {
        return null;
    }

    return (
        <section className={styles.listedNews}>
            <h2>Популярные новости</h2>

            <Link to={`/news/${lead.id}`} className={styles.lead}>
                <MediaElement
                    imageUrl={lead.imageUrl}
                    videoUrl={lead.videoUrl}
                    alt={lead.title}
                    className={styles.leadMedia}
                    playIconSize={36}
                    onError={(event) => {
                        event.target.onerror = null;
                        event.target.src = defaultImage;
                    }}
                />
                <span className={styles.leadTitle}>{lead.title}</span>
            </Link>

            {rest.length > 0 && (
                <ul className={styles.list}>
                    {rest.map((newsItem) => (
                        <li key={newsItem.id}>
                            <Link to={`/news/${newsItem.id}`} className={styles.row}>
                                <span className={styles.thumb}>
                                    <MediaElement
                                        imageUrl={newsItem.imageUrl}
                                        videoUrl={newsItem.videoUrl}
                                        alt=""
                                        className={styles.thumbMedia}
                                        showPlayIcon={false}
                                        playIconSize={16}
                                    />
                                </span>
                                <span className={styles.rowTitle}>{newsItem.title}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <Link to="/news" className={styles.viewAllLink}>
                Все новости
            </Link>
        </section>
    );
});
