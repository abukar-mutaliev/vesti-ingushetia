import React, { useState, useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addComment } from '@entities/comments/model/commentsSlice';
import styles from './AddCommentForm.module.scss';
import { selectUser } from '@entities/user/auth/model/authSelectors.js';
import {
    selectCommentsError,
    selectCommentsLoading,
} from '@entities/comments/model/commentSelectors.js';
import DOMPurify from 'dompurify';

export const AddCommentForm = React.memo(({ newsId }) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser, shallowEqual);
    const loading = useSelector(selectCommentsLoading);
    const reduxError = useSelector(selectCommentsError);

    const [commentText, setCommentText] = useState('');
    const [authorName, setAuthorName] = useState(user ? user.username : '');
    const [error, setError] = useState({ comment: null, author: null });

    useEffect(() => {
        if (reduxError) {
            setError((prevError) => ({
                ...prevError,
                comment: reduxError || prevError.comment,
            }));
        }
    }, [reduxError]);

    const handleSubmit = (e) => {
        e.preventDefault();
        let hasError = false;
        const newError = { comment: null, author: null };

        if (!commentText.trim()) {
            newError.comment = 'Комментарий не может быть пустым';
            hasError = true;
        }

        if (!user && authorName.trim() === '') {
            newError.author = 'Необходимо указать ваше имя';
            hasError = true;
        }

        if (hasError) {
            setError(newError);
            return;
        }
        const sanitizedComment = DOMPurify.sanitize(commentText);

        dispatch(
            addComment({
                newsId,
                content: sanitizedComment,
                authorName: user ? user.username : authorName,
                userId: user ? user.id : null,
            }),
        );

        setCommentText('');
        setAuthorName(user ? user.username : '');
        setError({ comment: null, author: null });
    };

    return (
        <form onSubmit={handleSubmit} className={styles.addCommentForm}>
            {!user && (
                <>
                    <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Введите ваше имя"
                        className={styles.authorNameInput}
                    />
                    {error.author && (
                        <p className={styles.error}>{error.author}</p>
                    )}
                </>
            )}
            <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Добавьте комментарий..."
                rows="4"
            />
            {error.comment && <p className={styles.error}>{error.comment}</p>}
            <button
                className={styles.submitButton}
                type="submit"
                disabled={loading}
            >
                {loading ? 'Отправка...' : 'Отправить'}
            </button>
        </form>
    );
});
