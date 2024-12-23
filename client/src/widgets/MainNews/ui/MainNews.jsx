import { memo, useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectLatestNews, selectIsLoading } from '@entities/news/model/newsSelectors';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import DOMPurify from 'dompurify';
import defaultImage from '@assets/default.jpg';
import styles from './MainNews.module.scss';
import { truncateHtmlToSentences } from '@shared/lib/TruncateHtml/truncateHtml';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement.jsx';
import { Loader } from '@shared/ui/Loader/index.js';

export const MainNews = memo(() => {
    const latestNews = useSelector(selectLatestNews, shallowEqual);
    const isLoading = useSelector(selectIsLoading);

    const videoMedia = useMemo(() => {
        return (
            latestNews?.mediaFiles?.find((media) => media.type === 'video') ||
            null
        );
    }, [latestNews?.mediaFiles]);

    const imageMedia = useMemo(() => {
        return (
            latestNews?.mediaFiles?.find((media) => media.type === 'image') ||
            null
        );
    }, [latestNews?.mediaFiles]);

    const imageUrl = useMemo(() => {
        return imageMedia?.url || defaultImage;
    }, [imageMedia]);

    const processedContent = useMemo(() => {
        if (!latestNews?.content) return 'Нет описания';

        let content = DOMPurify.sanitize(latestNews.content);
        content = highlightKeywordsInHtml(content, '');
        content = DOMPurify.sanitize(content);

        const truncatedContent = truncateHtmlToSentences(content, 1);
        return truncatedContent;
    }, [latestNews?.content]);

    const otherMediaFiles = useMemo(() => {
        return (
            latestNews?.mediaFiles?.filter(
                (m) => m.type === 'image' && m.url !== imageUrl,
            ) || []
        );
    }, [latestNews?.mediaFiles, imageUrl]);

    if (isLoading) {
        return (
            <div className={styles.mainNewsLoader}>
                <Loader />
            </div>
        );
    }

    if (!latestNews) {
        return <div className={styles.mainNewsNotFound}>Новостей нет</div>;
    }

    return (
        <div className={styles.mainNewsContainer}>
            <Link className={styles.mainNewsLink} to={`/news/${latestNews.id}`}>
                <div className={styles.mainNews}>
                    <MediaElement
                        imageUrl={imageUrl}
                        videoUrl={videoMedia?.url || null}
                        alt={latestNews.title}
                        className={styles.mainNewsMedia}
                        playIconSize={70}
                        showPlayIcon={true}
                        onError={(e) => (e.target.src = defaultImage)}
                    />
                    <div className={styles.mainNewsContent}>
                        <h2 className={styles.mainNewsTitle}>
                            {latestNews.title}
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
                                alt={latestNews.title}
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
