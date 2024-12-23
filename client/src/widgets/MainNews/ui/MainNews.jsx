import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import DOMPurify from 'dompurify';
import defaultImage from '@assets/default.jpg';
import styles from './MainNews.module.scss';
import { truncateHtmlToSentences } from '@shared/lib/TruncateHtml/truncateHtml';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement.jsx';
import { Loader } from '@shared/ui/Loader/index.js';

export const MainNews = memo(({ news, isLoading }) => {
    const videoMedia = useMemo(() => {
        return (
            news?.mediaFiles?.find((media) => media.type === 'video') ||
            null
        );
    }, [news?.mediaFiles]);

    const imageMedia = useMemo(() => {
        return (
            news?.mediaFiles?.find((media) => media.type === 'image') ||
            null
        );
    }, [news?.mediaFiles]);

    const imageUrl = useMemo(() => {
        return imageMedia?.url || defaultImage;
    }, [imageMedia]);

    const processedContent = useMemo(() => {
        if (!news?.content) return 'Нет описания';

        let content = DOMPurify.sanitize(news.content);


        content = highlightKeywordsInHtml(content, '');

        content = DOMPurify.sanitize(content);

        const truncatedContent = truncateHtmlToSentences(content, 1);
        return truncatedContent;
    }, [news?.content]);

    const otherMediaFiles = useMemo(() => {
        return (
            news?.mediaFiles?.filter(
                (m) => m.type === 'image' && m.url !== imageUrl,
            ) || []
        );
    }, [news?.mediaFiles, imageUrl]);

    if (isLoading) {
        return (
            <div className={styles.mainNewsLoader}>
                <Loader />
            </div>
        );
    }

    if (!news) {
        return <div className={styles.mainNewsNotFound}>Новостей нет</div>;
    }

    return (
        <div className={styles.mainNewsContainer}>
            <Link className={styles.mainNewsLink} to={`/news/${news.id}`}>
                <div className={styles.mainNews}>
                    <MediaElement
                        imageUrl={imageUrl}
                        videoUrl={videoMedia?.url || null}
                        alt={news.title}
                        className={styles.mainNewsMedia}
                        playIconSize={70}
                        showPlayIcon={true}
                        onError={(e) => (e.target.src = defaultImage)}
                    />
                    <div className={styles.mainNewsContent}>
                        <h2 className={styles.mainNewsTitle}>
                            {news.title}
                        </h2>
                        <div
                            className={styles.mainNewsDescription}
                            dangerouslySetInnerHTML={{
                                __html: processedContent,
                            }}
                        />
                        <div className={styles.readMoreButton}>
                            Читать полностью
                        </div>
                    </div>
                </div>
            </Link>

            {videoMedia && otherMediaFiles.length > 0 && (
                <div className={styles.otherMediaContainer}>
                    {otherMediaFiles.map((media) => (
                        <div key={media.id} className={styles.imageWrapper}>
                            <MediaElement
                                imageUrl={media.url}
                                videoUrl={null}
                                alt={news.title}
                                className={styles.mainNewsImage}
                                onError={(e) => (e.target.src = defaultImage)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

MainNews.propTypes = {
    news: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        content: PropTypes.string,
        mediaFiles: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.number.isRequired,
                type: PropTypes.string.isRequired,
                url: PropTypes.string.isRequired,
            })
        ),
    }),
    isLoading: PropTypes.bool,
};