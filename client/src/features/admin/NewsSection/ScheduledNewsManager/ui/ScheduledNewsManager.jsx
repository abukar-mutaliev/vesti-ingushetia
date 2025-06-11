import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchMyScheduledNews, 
    fetchAllScheduledNews,
    cancelScheduledNews,
    publishScheduledNewsNow,
    fetchScheduledNewsStats,
    clearError
} from '@entities/news/model/scheduledNewsSlice.js';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { 
    selectMyScheduledNews,
    selectAllScheduledNews,
    selectScheduledNewsLoading,
    selectScheduledNewsError,
    selectScheduledNewsStats,
    selectScheduledNewsOnly,
    selectScheduledNewsWithErrors,
    selectOverdueScheduledNews,
    selectUpcomingScheduledNews
} from '@entities/news/model/scheduledNewsSelectors.js';
import { truncateHtmlByChars } from '@shared/lib/TruncateHtml/truncateHtml.js';
import { FaClock, FaTrash, FaEye, FaPlay, FaExclamationCircle, FaCalendarCheck } from 'react-icons/fa6';
import { FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import styles from './ScheduledNewsManager.module.scss';
import {MoscowTimeUtils} from "@shared/lib/TimeUtils/timeUtils.js";

export const ScheduledNewsManager = ({ isAdmin = false }) => {
    const dispatch = useDispatch();
    const myScheduledNews = useSelector(selectMyScheduledNews);
    const allScheduledNews = useSelector(selectAllScheduledNews);
    const loading = useSelector(selectScheduledNewsLoading);
    const error = useSelector(selectScheduledNewsError);
    const stats = useSelector(selectScheduledNewsStats);
    const scheduledOnly = useSelector(selectScheduledNewsOnly);
    const newsWithErrors = useSelector(selectScheduledNewsWithErrors);
    const overdueNews = useSelector(selectOverdueScheduledNews);
    const upcomingNews = useSelector(selectUpcomingScheduledNews);

    const [filter, setFilter] = useState('all');
    const [selectedNews, setSelectedNews] = useState(null);
    const [showStats, setShowStats] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            dispatch(fetchAllScheduledNews());
            dispatch(fetchScheduledNewsStats());
        } else {
            dispatch(fetchMyScheduledNews());
        }

        // Автоматическое обновление каждую минуту
        const interval = setInterval(() => {
            if (isAdmin) {
                dispatch(fetchAllScheduledNews());
            } else {
                dispatch(fetchMyScheduledNews());
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [dispatch, isAdmin]);

    const handleCancelNews = async (newsId) => {
        if (window.confirm('Вы уверены, что хотите отменить эту отложенную новость?')) {
            try {
                await dispatch(cancelScheduledNews(newsId)).unwrap();
                // Обновляем список после отмены
                if (isAdmin) {
                    dispatch(fetchAllScheduledNews());
                } else {
                    dispatch(fetchMyScheduledNews());
                }
            } catch (error) {
                console.error('Ошибка при отмене новости:', error);
            }
        }
    };

    const handlePublishNow = async (newsId) => {
        if (window.confirm('Вы уверены, что хотите опубликовать эту новость сейчас?')) {
            try {
                await dispatch(publishScheduledNewsNow(newsId)).unwrap();
                // Обновляем список опубликованных новостей
                dispatch(fetchAllNews());
                // Обновляем список отложенных новостей
                if (isAdmin) {
                    dispatch(fetchAllScheduledNews());
                } else {
                    dispatch(fetchMyScheduledNews());
                }
            } catch (error) {
                console.error('Ошибка при публикации новости:', error);
            }
        }
    };

    const handleClearError = () => {
        dispatch(clearError());
    };

    const formatDate = (dateString) => {
        return MoscowTimeUtils.formatMoscowTime(dateString, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return '#4a67c8';
            case 'error': return '#dc3545';
            case 'cancelled': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'scheduled': return 'Запланировано';
            case 'error': return 'Ошибка';
            case 'cancelled': return 'Отменено';
            default: return 'Неизвестно';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'scheduled': return <FaClock />;
            case 'error': return <FaExclamationCircle />;
            case 'cancelled': return <FaTrash />;
            default: return <FaClock />;
        }
    };

    const isOverdue = (publishDate) => {
        return new Date(publishDate) <= new Date();
    };

    const newsToDisplay = isAdmin ? allScheduledNews : myScheduledNews;

    const filteredNews = newsToDisplay.filter(news => {
        switch (filter) {
            case 'scheduled': return news.status === 'scheduled';
            case 'error': return news.status === 'error';
            case 'overdue': return news.status === 'scheduled' && isOverdue(news.publishDate);
            case 'upcoming': return news.status === 'scheduled' && !isOverdue(news.publishDate);
            default: return true;
        }
    });

    return (
        <div className={styles.scheduledNewsManager}>
            <div className={styles.header}>
                <h2>
                    {isAdmin ? 'Все отложенные новости' : 'Мои отложенные новости'}
                </h2>
                
                {isAdmin && (
                    <button 
                        className={styles.statsButton}
                        onClick={() => setShowStats(!showStats)}
                    >
                        <FaChartBar />
                        Статистика
                    </button>
                )}
            </div>

            {error && (
                <div className={styles.errorMessage}>
                    <span>{error}</span>
                    <button onClick={handleClearError}>×</button>
                </div>
            )}

            {showStats && stats && (
                <div className={styles.statsPanel}>
                    <h3>Статистика планировщика</h3>
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats.totalScheduled || 0}</span>
                            <span className={styles.statLabel}>Всего запланировано</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats.publishedToday || 0}</span>
                            <span className={styles.statLabel}>Опубликовано сегодня</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats.errors || 0}</span>
                            <span className={styles.statLabel}>Ошибок</span>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.filters}>
                <button
                    className={filter === 'all' ? styles.active : ''}
                    onClick={() => setFilter('all')}
                >
                    Все ({newsToDisplay.length})
                </button>
                <button
                    className={filter === 'scheduled' ? styles.active : ''}
                    onClick={() => setFilter('scheduled')}
                >
                    Запланированные ({scheduledOnly.length})
                </button>
                <button
                    className={filter === 'upcoming' ? styles.active : ''}
                    onClick={() => setFilter('upcoming')}
                >
                    Предстоящие ({upcomingNews.length})
                </button>
                <button
                    className={filter === 'overdue' ? styles.active : ''}
                    onClick={() => setFilter('overdue')}
                >
                    Просроченные ({overdueNews.length})
                </button>
                <button
                    className={filter === 'error' ? styles.active : ''}
                    onClick={() => setFilter('error')}
                >
                    Ошибки ({newsWithErrors.length})
                </button>
            </div>

            {loading && (
                <div className={styles.loading}>
                    <FaClock className={styles.spinner} />
                    Загрузка...
                </div>
            )}

            <div className={styles.newsGrid}>
                {filteredNews.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaCalendarCheck className={styles.emptyIcon} />
                        <p>Нет отложенных новостей</p>
                    </div>
                ) : (
                    filteredNews.map(news => (
                        <div
                            key={news.id}
                            className={`${styles.newsCard} ${isOverdue(news.publishDate) && news.status === 'scheduled' ? styles.overdue : ''}`}
                        >
                            <div className={styles.cardHeader}>
                                <span
                                    className={styles.status}
                                    style={{ backgroundColor: getStatusColor(news.status) }}
                                >
                                    {getStatusIcon(news.status)}
                                    {getStatusText(news.status)}
                                </span>
                                {isOverdue(news.publishDate) && news.status === 'scheduled' && (
                                    <span className={styles.overdueLabel}>Просрочено</span>
                                )}
                            </div>

                            <h3 className={styles.title}>{news.title || 'Без заголовка'}</h3>

                            <div className={styles.content}>
                                {news.content && news.content.length > 0 ? (
                                    truncateHtmlByChars(news.content, 150)
                                ) : (
                                    'Содержание отсутствует'
                                )}
                            </div>

                            <div className={styles.metadata}>
                                <div className={styles.publishDate}>
                                    <FaCalendarAlt />
                                    <span>Публикация: {formatDate(news.publishDate)}</span>
                                </div>
                                {news.createdAt && (
                                    <div className={styles.createdDate}>
                                        <small>Создано: {formatDate(news.createdAt)}</small>
                                    </div>
                                )}
                                {news.author && (
                                    <div className={styles.author}>
                                        <small>Автор: {news.author.username || 'Неизвестно'}</small>
                                    </div>
                                )}
                            </div>

                            <div className={styles.actions}>
                                <button
                                    className={styles.previewBtn}
                                    onClick={() => setSelectedNews(news)}
                                    title="Предварительный просмотр"
                                >
                                    <FaEye />
                                </button>

                                {news.status === 'scheduled' && (
                                    <button
                                        className={styles.publishBtn}
                                        onClick={() => handlePublishNow(news.id)}
                                        title="Опубликовать сейчас"
                                    >
                                        <FaPlay />
                                    </button>
                                )}

                                <button
                                    className={styles.cancelBtn}
                                    onClick={() => handleCancelNews(news.id)}
                                    title="Отменить"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedNews && (
                <div className={styles.previewModal} onClick={() => setSelectedNews(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Предварительный просмотр</h3>
                            <button 
                                className={styles.closeBtn}
                                onClick={() => setSelectedNews(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <h4>{selectedNews.title || 'Без заголовка'}</h4>
                            <div className={styles.modalMeta}>
                                <span>Статус: {getStatusText(selectedNews.status)}</span>
                                <span>Публикация: {formatDate(selectedNews.publishDate)}</span>
                            </div>
                            <div 
                                className={styles.previewContent}
                                dangerouslySetInnerHTML={{ 
                                    __html: selectedNews.content || 'Содержание отсутствует' 
                                }} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 