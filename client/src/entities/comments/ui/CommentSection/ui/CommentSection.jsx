import React, { memo, useCallback, useState, useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
    selectCommentsError,
    selectCommentsLoading,
    selectCommentsByNewsId,
} from '@entities/comments/model/commentSelectors';
import styles from './CommentSection.module.scss';
import { CommentItem } from '@entities/comments/ui/CommentItem/';
import { AddCommentForm } from '@features/comments/AddCommentForm/';
import { fetchCommentsForNews } from '@entities/comments/model/commentsSlice.js';

export const CommentSection = memo(({ newsId, authorName, userId }) => {
    const dispatch = useDispatch();
    const loading = useSelector(selectCommentsLoading);
    const error = useSelector(selectCommentsError);
    const comments = useSelector(selectCommentsByNewsId(newsId), shallowEqual);

    const [isCommentsVisible, setIsCommentsVisible] = useState(false);
    const [showAddComment, setShowAddComment] = useState(false);

    const handleToggleComments = useCallback(() => {
        setIsCommentsVisible((prev) => !prev);
    }, []);

    const handleShowAddComment = useCallback(() => {
        setShowAddComment((prev) => !prev);
    }, []);

    useEffect(() => {
        dispatch(fetchCommentsForNews(newsId));
    }, [dispatch, newsId]);

    if (error) {
        return (
            <p>{`Ошибка загрузки комментариев: ${error.message || error}`}</p>
        );
    }

    if (loading) {
        return <p>Загрузка комментариев...</p>;
    }

    return (
        <div className={styles.commentSection}>
            <button
                onClick={handleToggleComments}
                className={styles.toggleButton}
            >
                Комментарии ({comments.length})
                <span
                    className={`${styles.arrow} ${isCommentsVisible ? styles.arrowUp : ''}`}
                >
                    ▼
                </span>
            </button>

            {isCommentsVisible && (
                <>
                    {comments.length === 0 ? (
                        <p>Комментарии отсутствуют</p>
                    ) : (
                        <ul className={styles.commentList}>
                            {comments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    isReply={false}
                                />
                            ))}
                        </ul>
                    )}
                </>
            )}
            <button
                onClick={handleShowAddComment}
                className={styles.addCommentButton}
            >
                Написать комментарий
            </button>

            {showAddComment && (
                <AddCommentForm
                    newsId={newsId}
                    authorName={authorName}
                    userId={userId}
                />
            )}
        </div>
    );
});
