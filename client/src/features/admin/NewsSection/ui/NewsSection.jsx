import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';
import {
    deleteNews,
    fetchAllNews,
    loadNewsFromLocalStorage,
} from '@entities/news/model/newsSlice.js';
import styles from './NewsSection.module.scss';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';

export const NewsSection = ({ onEditNews, onAddNews }) => {
    const dispatch = useDispatch();
    const news = useSelector(selectNewsList);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [newsIdToDelete, setNewsIdToDelete] = useState(null);

    useEffect(() => {
        dispatch(loadNewsFromLocalStorage());
    }, [dispatch]);

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

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Новости</h1>
                <button className={styles.create} onClick={onAddNews}>
                    + Добавить новость
                </button>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.hideOnMobile}>Id</th>
                        <th>Содержание</th>
                        <th>Редактировать</th>
                        <th>Удалить</th>
                    </tr>
                </thead>
                <tbody>
                    {news.map((item) => (
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
                    ))}
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
