import { useEffect } from 'react';
import { useScheduledNews } from '@shared/hooks/useScheduledNews.js';
import { FaClock, FaExclamationCircle } from 'react-icons/fa6';
import styles from './ScheduledNewsIndicator.module.scss';

export const ScheduledNewsIndicator = ({ isAdmin = false }) => {
    const {
        scheduledCount,
        overdueNews,
        newsWithErrors,
        upcomingNews,
        loadScheduledNews,
        loading
    } = useScheduledNews(isAdmin);

    useEffect(() => {
        loadScheduledNews();
        
        // Обновляем каждые 5 минут
        const interval = setInterval(loadScheduledNews, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadScheduledNews]);

    if (loading) {
        return (
            <div className={styles.indicator}>
                <FaClock className={styles.spinner} />
            </div>
        );
    }

    if (scheduledCount === 0) {
        return null;
    }

    const hasOverdue = overdueNews.length > 0;
    const hasErrors = newsWithErrors.length > 0;

    return (
        <div className={`${styles.indicator} ${hasOverdue || hasErrors ? styles.warning : ''}`}>
            <div className={styles.icon}>
                {hasErrors ? (
                    <FaExclamationCircle />
                ) : hasOverdue ? (
                    <FaExclamationCircle />
                ) : (
                    <FaClock />
                )}
            </div>
            
            <div className={styles.content}>
                <div className={styles.count}>
                    {scheduledCount}
                </div>
                <div className={styles.label}>
                    отложенных
                </div>
                
                {(hasOverdue || hasErrors) && (
                    <div className={styles.alerts}>
                        {hasOverdue && (
                            <span className={styles.overdue}>
                                {overdueNews.length} просрочено
                            </span>
                        )}
                        {hasErrors && (
                            <span className={styles.errors}>
                                {newsWithErrors.length} ошибок
                            </span>
                        )}
                    </div>
                )}
                
                {upcomingNews.length > 0 && upcomingNews[0] && upcomingNews[0].publishDate && (
                    <div className={styles.upcoming}>
                        Ближайшая: {new Date(upcomingNews[0].publishDate).toLocaleString('ru-RU', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}; 