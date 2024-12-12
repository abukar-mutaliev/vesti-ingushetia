import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { replyToComment } from '@entities/comments/model/commentsSlice';
import styles from './AddReplyForm.module.scss';
import DOMPurify from 'dompurify';

export const AddReplyForm = ({ parentId, onCancel }) => {
    const dispatch = useDispatch();
    const [content, setContent] = useState('');
    const user = useSelector((state) => state.auth.user);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        const authorName = user ? user.username : 'Аноним';
        const userId = user ? user.id : null;
        const sanitizedComment = DOMPurify.sanitize(content);
        const sanitizedAuthorName = DOMPurify.sanitize(authorName);

        dispatch(
            replyToComment({
                parentCommentId: parentId,
                content: sanitizedComment,
                authorName: sanitizedAuthorName,
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
