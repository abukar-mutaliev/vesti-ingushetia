import styles from './VideoNewsList.module.scss';
import { NewsCard } from '@widgets/NewsCard/index.js';

export const VideoNewsList = ({ newsList }) => {
    return (
        <div className={styles.videoNewsList}>
            {newsList.map((newsItem) => (
                <NewsCard key={newsItem.id} news={newsItem} />
            ))}
        </div>
    );
};
