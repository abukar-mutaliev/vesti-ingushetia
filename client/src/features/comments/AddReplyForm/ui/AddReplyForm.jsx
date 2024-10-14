import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { replyToComment } from '@entities/comments/model/commentsSlice';
import styles from './AddReplyForm.module.scss';
export const AddReplyForm = ({ parentId, onCancel }) => {
    const dispatch = useDispatch();
    const [content, setContent] = useState('');
    const user = useSelector((state) => state.auth.user);
    console.log('userId', user);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        const authorName = user ? user.username : 'Аноним';
        const userId = user ? user.id : null;

        dispatch(
            replyToComment({
                parentCommentId: parentId,
                content,
                authorName,
                userId,
            }),
        );
        setContent('');
        if (onCancel) onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className={styles.replyForm}>
            <textarea
                value={content}
                className={styles.replyTextarea}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ваш ответ..."
            />
            <button className={styles.replySubmitButton} type="submit">
                Ответить
            </button>
            <button
                className={styles.replyCancelButton}
                type="button"
                onClick={onCancel}
            >
                Отмена
            </button>
        </form>
    );
};
