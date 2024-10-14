import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './CommentsSection.module.scss';
import { Link } from 'react-router-dom';

import { selectCommentsByNews } from '@entities/comments/model/commentSelectors.js';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';
import { selectIsAdmin } from '@entities/user/auth/model/authSelectors.js';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import {
    deleteComment,
    fetchCommentsForNews,
} from '@entities/comments/model/commentsSlice.js';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';

export const CommentsSection = () => {
    const dispatch = useDispatch();
    const commentsByNews = useSelector(selectCommentsByNews);
    const newsList = useSelector(selectNewsList);
    const isAdmin = useSelector(selectIsAdmin);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedCommentId, setSelectedCommentId] = useState(null);

    useEffect(() => {
        dispatch(fetchCommentsForNews());
        dispatch(fetchAllNews());
    }, [dispatch]);

    const openDeleteModal = (commentId) => {
        setSelectedCommentId(commentId);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setSelectedCommentId(null);
    };

    const handleConfirmDelete = () => {
        if (selectedCommentId) {
            dispatch(deleteComment(selectedCommentId));
        }
        closeDeleteModal();
    };

    const renderComments = (comments, newsId) => {
        return comments.map((comment) => (
            <div key={comment.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                    <span className={styles.author}>
                        {comment.user?.username ||
                            comment.authorName ||
                            'Аноним'}
                    </span>
                    {isAdmin && (
                        <button
                            className={styles.deleteButton}
                            onClick={() => openDeleteModal(comment.id)}
                        >
                            Удалить
                        </button>
                    )}
                </div>
                <Link to={`/news/${newsId}`} className={styles.commentLink}>
                    <p className={styles.content}>{comment.content}</p>
                </Link>
                {comment.replies && comment.replies.length > 0 && (
                    <div className={styles.replies}>
                        {renderComments(comment.replies, newsId)}
                    </div>
                )}
            </div>
        ));
    };

    const newsWithComments = Object.keys(commentsByNews)
        .filter((newsId) => commentsByNews[newsId].length > 0)
        .map((newsId) => {
            const newsItem = newsList.find(
                (news) => news.id.toString() === newsId,
            );
            return {
                newsId,
                title: newsItem ? newsItem.title : `Новость ID: ${newsId}`,
                comments: commentsByNews[newsId],
            };
        });

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Комментарии</h1>
            </div>
            <div className={styles.commentsList}>
                {newsWithComments.length > 0 ? (
                    newsWithComments.map(({ newsId, title, comments }) => (
                        <div key={newsId} className={styles.newsSection}>
                            <h3 className={styles.newsTitle}>
                                Новость: {title}
                            </h3>
                            {renderComments(comments, newsId)}
                        </div>
                    ))
                ) : (
                    <p>Нет комментариев.</p>
                )}
            </div>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                description="Вы уверены что хотите удалить этот комментарий пользователя?"
            />
        </div>
    );
};
