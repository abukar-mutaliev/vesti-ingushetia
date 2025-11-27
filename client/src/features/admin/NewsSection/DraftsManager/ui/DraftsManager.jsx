import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createNews, fetchAllNews } from '@entities/news/model/newsSlice.js';
import { createScheduledNews, fetchMyScheduledNews } from '@entities/news/model/scheduledNewsSlice.js';
import { useScheduledNews } from '@shared/hooks/useScheduledNews.js';
import { truncateHtmlByChars } from '@shared/lib/TruncateHtml/truncateHtml.js';
import { FaClock, FaTrash, FaEye, FaPlay } from 'react-icons/fa6';
import { FaEdit, FaCalendarAlt } from 'react-icons/fa';
import styles from './DraftsManager.module.scss';
import {formatMoscowTime} from "@shared/lib/TimeUtils/timeUtils.js";

export const DraftsManager = ({ onEditDraft }) => {
    const dispatch = useDispatch();
    const [localDrafts, setLocalDrafts] = useState([]);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [filter, setFilter] = useState('all'); // all, draft, scheduled

    const {
        myScheduledNews,
        loading: scheduledLoading,
        cancelNews,
        publishNow,
        loadScheduledNews
    } = useScheduledNews();

    useEffect(() => {
        loadLocalDrafts();
        loadScheduledNews();
        
        const interval = setInterval(() => {
            checkScheduledNews();
            loadScheduledNews(); // Обновляем серверные отложенные новости
        }, 60000); // Проверяем каждую минуту
        
        return () => clearInterval(interval);
    }, [loadScheduledNews]);

    const loadLocalDrafts = () => {
        const savedDrafts = JSON.parse(localStorage.getItem('newsDrafts') || '[]');
        setLocalDrafts(savedDrafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    };

    const checkScheduledNews = () => {
        const now = new Date();
        const savedDrafts = JSON.parse(localStorage.getItem('newsDrafts') || '[]');

        const toPublish = savedDrafts.filter(draft =>
            draft.status === 'scheduled' &&
            new Date(draft.deferredDate) <= now
        );

        toPublish.forEach(draft => {
            publishScheduledNews(draft);
        });

        if (toPublish.length > 0) {
            loadLocalDrafts();
        }
    };

    const publishScheduledNews = async (draft) => {
        try {
            const formData = new FormData();
            formData.append('title', draft.newsTitle);
            formData.append('content', draft.newsContent);
            formData.append('categoryIds', JSON.stringify(draft.selectedCategoryIds));

            if (draft.videoUrl) {
                formData.append('videoUrl', draft.videoUrl);
            }

            if (draft.publishDate) {
                formData.append('publishDate', draft.publishDate);
            }

            await dispatch(createNews(formData)).unwrap();
            await dispatch(fetchAllNews());

            deleteDraft(draft.id);

            console.log(`Отложенная новость "${draft.newsTitle}" успешно опубликована`);
        } catch (error) {
            console.error('Ошибка при публикации отложенной новости:', error);

            const updatedDrafts = localDrafts.map(d =>
                d.id === draft.id
                    ? { ...d, status: 'draft', error: 'Ошибка при публикации' }
                    : d
            );
            localStorage.setItem('newsDrafts', JSON.stringify(updatedDrafts));
            setLocalDrafts(updatedDrafts);
        }
    };

    const deleteDraft = (draftId) => {
        const updatedDrafts = localDrafts.filter(draft => draft.id !== draftId);
        localStorage.setItem('newsDrafts', JSON.stringify(updatedDrafts));
        setLocalDrafts(updatedDrafts);
        if (selectedDraft?.id === draftId) {
            setSelectedDraft(null);
        }
    };

    const editDraft = (draft) => {
        localStorage.setItem('adminDashboard_addNewsSectionFormData', JSON.stringify({
            newsTitle: draft.newsTitle,
            newsContent: draft.newsContent,
            selectedCategoryIds: draft.selectedCategoryIds,
            videoUrl: draft.videoUrl,
            publishDate: draft.publishDate,
            isDeferred: draft.status === 'scheduled',
            deferredDate: draft.deferredDate
        }));

        // Флаг для возврата к черновикам после сохранения/отмены
        localStorage.setItem('returnToDraftsAfterSave', 'true');

        deleteDraft(draft.id);
        onEditDraft && onEditDraft();
    };

    const editServerScheduledNews = async (item) => {
        const realId = item.id.replace('server-', '');
        
        console.log('✏️ Редактирование отложенной новости:', {
            id: realId,
            title: item.newsTitle,
            mediaFiles: item.mediaFiles,
            deferredDate: item.deferredDate
        });
        
        // Форматируем дату для input datetime-local
        let formattedDeferredDate = '';
        if (item.deferredDate) {
            const date = new Date(item.deferredDate);
            // Форматируем в YYYY-MM-DDTHH:mm для input datetime-local
            formattedDeferredDate = date.toISOString().slice(0, 16);
        }
        
        // Извлекаем URL изображений
        const mediaUrls = item.mediaFiles?.map(m => m.url).filter(url => url) || [];
        console.log('📷 URL изображений для редактирования:', mediaUrls);
        
        // Загружаем данные в форму редактирования
        // НЕ отменяем новость сразу - сохраняем ID для отмены при сохранении
        const formData = {
            newsTitle: item.newsTitle,
            newsContent: item.newsContent,
            selectedCategoryIds: item.categoryIds || [],
            videoUrl: item.videoUrl || '',
            publishDate: '',
            isDeferred: true,
            deferredDate: formattedDeferredDate,
            // ID запланированной новости для отмены при сохранении
            scheduledNewsIdToCancel: realId,
            // Сохраняем URL изображений для отображения
            existingMediaUrls: mediaUrls
        };
        
        console.log('💾 Сохранение в localStorage:', formData);
        localStorage.setItem('adminDashboard_addNewsSectionFormData', JSON.stringify(formData));
        
        // Флаг для возврата к черновикам после сохранения
        localStorage.setItem('returnToDraftsAfterSave', 'true');

        onEditDraft && onEditDraft();
    };

    const publishNowLocal = async (draft) => {
        try {
            const formData = new FormData();
            formData.append('title', draft.newsTitle);
            formData.append('content', draft.newsContent);
            formData.append('categoryIds', JSON.stringify(draft.selectedCategoryIds));

            if (draft.videoUrl) {
                formData.append('videoUrl', draft.videoUrl);
            }

            await dispatch(createNews(formData)).unwrap();
            await dispatch(fetchAllNews());

            deleteDraft(draft.id);
        } catch (error) {
            console.error('Ошибка при публикации:', error);
        }
    };

    const handleCancelServerScheduled = async (newsId) => {
        if (window.confirm('Вы уверены, что хотите отменить эту отложенную новость?')) {
            try {
                await cancelNews(newsId).unwrap();
                loadScheduledNews(); // Обновляем список
            } catch (error) {
                console.error('Ошибка при отмене новости:', error);
            }
        }
    };

    const handlePublishServerScheduled = async (newsId) => {
        if (window.confirm('Вы уверены, что хотите опубликовать эту новость сейчас?')) {
            try {
                await publishNow(newsId).unwrap();
                dispatch(fetchAllNews()); // Обновляем список опубликованных новостей
                loadScheduledNews(); // Обновляем список отложенных
            } catch (error) {
                console.error('Ошибка при публикации новости:', error);
            }
        }
    };

    const formatDate = (dateString) => {
        return formatMoscowTime(dateString, {
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
            case 'draft': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'scheduled': return 'Запланировано';
            case 'draft': return 'Черновик';
            default: return 'Неизвестно';
        }
    };

    const isScheduledInPast = (draft) => {
        if (draft.status !== 'scheduled') return false;
        return new Date(draft.deferredDate) <= new Date();
    };

    // Объединяем локальные черновики с серверными отложенными новостями
    const getAllNewsItems = () => {
        const serverScheduled = myScheduledNews.map(news => {
            console.log('📰 Серверная новость:', news.title, 'mediaFiles:', news.mediaFiles);
            return {
                ...news,
                id: `server-${news.id}`,
                newsTitle: news.title || 'Без заголовка',
                newsContent: news.content || '',
                deferredDate: news.publishDate || news.scheduledDate,
                createdAt: news.createdAt,
                status: news.status,
                isServerNews: true,
                categoryIds: news.categoryIds || news.categories?.map(c => c.id) || [],
                videoUrl: news.videoUrl || '',
                mediaFiles: news.mediaFiles || []
            };
        });

        return [...localDrafts, ...serverScheduled];
    };

    const filteredNews = getAllNewsItems().filter(item => {
        switch (filter) {
            case 'draft': 
                return !item.isServerNews && item.status === 'draft';
            case 'scheduled':
                return item.isServerNews;
            default: 
                return true;
        }
    });

    const localDraftsCount = localDrafts.filter(d => d.status === 'draft').length;
    const serverScheduledCount = myScheduledNews.length;

    return (
        <div className={styles.draftsManager}>
            <div className={styles.header}>
                <h2>Управление черновиками и отложенными новостями</h2>
                <div className={styles.filters}>
                    <button
                        className={filter === 'all' ? styles.active : ''}
                        onClick={() => setFilter('all')}
                    >
                        Все ({getAllNewsItems().length})
                    </button>
                    <button
                        className={filter === 'draft' ? styles.active : ''}
                        onClick={() => setFilter('draft')}
                    >
                        Черновики ({localDraftsCount})
                    </button>
                    <button
                        className={filter === 'scheduled' ? styles.active : ''}
                        onClick={() => setFilter('scheduled')}
                    >
                        Отложенные новости ({serverScheduledCount})
                    </button>
                </div>
            </div>

            {scheduledLoading && (
                <div className={styles.loading}>
                    <FaClock className={styles.spinner} />
                    Загрузка отложенных новостей...
                </div>
            )}

            <div className={styles.draftsGrid}>
                {filteredNews.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Нет сохраненных новостей</p>
                    </div>
                ) : (
                    filteredNews.map(item => (
                        <div
                            key={item.id}
                            className={`${styles.draftCard} ${
                                !item.isServerNews && isScheduledInPast(item) ? styles.pastDue : ''
                            } ${item.isServerNews ? styles.serverNews : ''}`}
                        >
                            <div className={styles.cardHeader}>
                                <span
                                    className={styles.status}
                                    style={{ backgroundColor: getStatusColor(item.status) }}
                                >
                                    {item.status === 'scheduled' ? <FaClock /> : <FaEdit />}
                                    {getStatusText(item.status)}
                                </span>
                                {item.error && (
                                    <span className={styles.error}>Ошибка публикации</span>
                                )}
                            </div>

                            <h3 className={styles.title}>{item.newsTitle || 'Без заголовка'}</h3>

                            <div className={styles.content}>
                                {item.newsContent && item.newsContent.length > 0 ? (
                                    truncateHtmlByChars(item.newsContent, 150)
                                ) : (
                                    'Содержание отсутствует'
                                )}
                            </div>

                            <div className={styles.metadata}>
                                <div className={styles.dates}>
                                    <small>Создано: {formatDate(item.createdAt || new Date())}</small>
                                    {item.status === 'scheduled' && item.deferredDate && (
                                        <small className={styles.scheduledDate}>
                                            <FaCalendarAlt />
                                            Публикация: {formatDate(item.deferredDate)}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <button
                                    className={styles.editBtn}
                                    onClick={() => 
                                        item.isServerNews 
                                            ? editServerScheduledNews(item)
                                            : editDraft(item)
                                    }
                                    title="Редактировать"
                                >
                                    <FaEdit />
                                </button>

                                <button
                                    className={styles.publishBtn}
                                    onClick={() => 
                                        item.isServerNews 
                                            ? handlePublishServerScheduled(item.id.replace('server-', ''))
                                            : publishNowLocal(item)
                                    }
                                    title="Опубликовать сейчас"
                                >
                                    {item.isServerNews ? <FaPlay /> : <FaEye />}
                                </button>

                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => 
                                        item.isServerNews 
                                            ? handleCancelServerScheduled(item.id.replace('server-', ''))
                                            : deleteDraft(item.id)
                                    }
                                    title={item.isServerNews ? "Отменить" : "Удалить"}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedDraft && (
                <div className={styles.previewModal}>
                    <div className={styles.modalContent}>
                        <h3>Предварительный просмотр</h3>
                        <h4>{selectedDraft.newsTitle || 'Без заголовка'}</h4>
                        <div dangerouslySetInnerHTML={{ 
                            __html: selectedDraft.newsContent || 'Содержание отсутствует'
                        }} />
                        <button onClick={() => setSelectedDraft(null)}>Закрыть</button>
                    </div>
                </div>
            )}
        </div>
    );
};