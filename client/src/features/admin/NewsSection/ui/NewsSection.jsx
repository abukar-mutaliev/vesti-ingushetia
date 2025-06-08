import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';
import {
    deleteNews,
    fetchAllNews,
} from '@entities/news/model/newsSlice.js';
import styles from './NewsSection.module.scss';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';
import { FaClock, FaPlus } from 'react-icons/fa6';
import { FaEdit } from 'react-icons/fa';
import {DraftsManager} from "@features/admin/NewsSection/DraftsManager/index.js";

export const NewsSection = ({ onEditNews, onAddNews }) => {
    const dispatch = useDispatch();
    const news = useSelector(selectNewsList);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [newsIdToDelete, setNewsIdToDelete] = useState(null);
    const [showDrafts, setShowDrafts] = useState(false);
    const [draftsCount, setDraftsCount] = useState({ total: 0, scheduled: 0, drafts: 0 });

    useEffect(() => {
        dispatch(fetchAllNews());
        updateDraftsCount();

        const interval = setInterval(updateDraftsCount, 30000);
        return () => clearInterval(interval);
    }, [dispatch]);

    const updateDraftsCount = () => {
        const savedDrafts = JSON.parse(localStorage.getItem('newsDrafts') || '[]');
        const scheduledCount = savedDrafts.filter(draft => draft.status === 'scheduled').length;
        const draftsOnlyCount = savedDrafts.filter(draft => draft.status === 'draft').length;

        setDraftsCount({
            total: savedDrafts.length,
            scheduled: scheduledCount,
            drafts: draftsOnlyCount
        });
    };

    const openDeleteModal = (id) => {
        setNewsIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setNewsIdToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (newsIdToDelete) {
            dispatch(deleteNews(newsIdToDelete))
                .unwrap()
                .then(() => {
                    dispatch(fetchAllNews());
                    closeDeleteModal();
                });
        }
    };

    const handleDraftsToggle = () => {
        setShowDrafts(!showDrafts);
        updateDraftsCount();
    };

    const handleEditFromDrafts = () => {
        setShowDrafts(false);
        onAddNews();
        updateDraftsCount();
    };

    if (showDrafts) {
        return (
            <div className={styles.section}>
                <div className={styles.topbar}>
                    <h1>Черновики и отложенные новости</h1>
                    <div className={styles.buttonGroup}>
                        <button
                            className={styles.backButton}
                            onClick={() => setShowDrafts(false)}
                        >
                            ← Назад к новостям
                        </button>
                    </div>
                </div>
                <DraftsManager onEditDraft={handleEditFromDrafts} />
            </div>
        );
    }

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Новости</h1>
                <div className={styles.buttonGroup}>
                    <button
                        className={styles.draftsButton}
                        onClick={handleDraftsToggle}
                        title="Просмотр черновиков и отложенных новостей"
                    >
                        <FaEdit className={styles.buttonIcon} />
                        Черновики
                        {draftsCount.total > 0 && (
                            <span className={styles.badge}>
                                {draftsCount.total}
                            </span>
                        )}
                    </button>

                    {draftsCount.scheduled > 0 && (
                        <button
                            className={styles.scheduledButton}
                            onClick={handleDraftsToggle}
                            title="Отложенные новости"
                        >
                            <FaClock className={styles.buttonIcon} />
                            Отложенные
                            <span className={styles.scheduledBadge}>
                                {draftsCount.scheduled}
                            </span>
                        </button>
                    )}

                    <button className={styles.create} onClick={onAddNews}>
                        <FaPlus className={styles.buttonIcon} />
                        Добавить новость
                    </button>
                </div>
            </div>

            {draftsCount.total > 0 && (
                <div className={styles.draftsInfo}>
                    <div className={styles.infoCard}>
                        <div className={styles.infoContent}>
                            <span className={styles.infoText}>
                                У вас есть {draftsCount.drafts} черновиков
                                {draftsCount.scheduled > 0 && ` и ${draftsCount.scheduled} отложенных новостей`}
                            </span>
                            <button
                                className={styles.infoButton}
                                onClick={handleDraftsToggle}
                            >
                                Просмотреть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <table className={styles.table}>
                <thead>
                <tr>
                    <th className={styles.hideOnMobile}>Id</th>
                    <th>Содержание</th>
                    <th>Дата создания</th>
                    <th>Редактировать</th>
                    <th>Удалить</th>
                </tr>
                </thead>
                <tbody>
                {news.length === 0 ? (
                    <tr>
                        <td colSpan="5" className={styles.emptyState}>
                            <div className={styles.emptyContent}>
                                <FaEdit className={styles.emptyIcon} />
                                <p>Новостей пока нет</p>
                                <button
                                    className={styles.emptyButton}
                                    onClick={onAddNews}
                                >
                                    Создать первую новость
                                </button>
                            </div>
                        </td>
                    </tr>
                ) : (
                    news.map((item) => (
                        <tr key={item.id}>
                            <td className={styles.hideOnMobile}>{item.id}</td>
                            <td>
                                <Link
                                    to={`/news/${item.id}`}
                                    className={styles.newsLink}
                                >
                                    {item.title}
                                </Link>
                            </td>
                            <td className={styles.dateColumn}>
                                {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </td>
                            <td>
                                <button
                                    className={styles.editButton}
                                    onClick={() => onEditNews(item)}
                                >
                                    Изменить
                                </button>
                            </td>
                            <td>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => openDeleteModal(item.id)}
                                >
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                description="Вы уверены что хотите удалить эту новость?"
            />
        </div>
    );
};