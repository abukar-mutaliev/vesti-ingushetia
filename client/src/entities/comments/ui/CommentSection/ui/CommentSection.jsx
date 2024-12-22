import { memo, useCallback, useState, useEffect, useMemo } from 'react';
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
import { Loader } from '@shared/ui/Loader/index.js';
import { selectUserAuth } from '@entities/user/auth/model/authSelectors.js';

export const CommentSection = memo(({ newsId, authorName, userId }) => {
    const dispatch = useDispatch();
    const loading = useSelector(selectCommentsLoading);
    const error = useSelector(selectCommentsError);
    const commentsSelector = useMemo(() => selectCommentsByNewsId(newsId), [newsId]);
    const comments = useSelector(commentsSelector, shallowEqual);
    const user = useSelector(selectUserAuth, shallowEqual)

    const [isCommentsVisible, setIsCommentsVisible] = useState(false);
    const [showAddComment, setShowAddComment] = useState(false);

    const handleToggleComments = useCallback(() => {
        setIsCommentsVisible((prev) => !prev);
    }, []);

    const handleShowAddComment = useCallback(() => {
        setShowAddComment((prev) => !prev);
    }, []);

    useEffect(() => {
        if (newsId) {
            dispatch(fetchCommentsForNews(newsId));
        }
    }, [dispatch, newsId]);

    if (error) {
        return (
            <div className={styles.commentSection}>
                <p className={styles.error}>
                    {`Ошибка загрузки комментариев: ${error.message || error}`}
                </p>
            </div>
        );
    }
    return (
        <div className={styles.commentSection}>
            <button
                onClick={handleToggleComments}
                className={styles.toggleButton}
                aria-expanded={isCommentsVisible}
                aria-controls="comments-list"
            >
                Комментарии ({comments.length})
                <span
                    className={`${styles.arrow} ${isCommentsVisible ? styles.arrowUp : ''}`}
                    aria-hidden="true"
                >
                    ▼
                </span>
            </button>

            {isCommentsVisible && (
                <>
                    {loading ? (
                        <Loader />
                    ) : comments.length === 0 ? (
                        <p className={styles.noComments}>Комментарии отсутствуют</p>
                    ) : (
                        <ul className={styles.commentList} id="comments-list">
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
            {user === false ? (
                <button
                    onClick={handleShowAddComment}
                    className={styles.addCommentButtonDisabled}
                    aria-expanded={showAddComment}
                    title="Для комментирования авторизуйся"
                    disabled
                >
                    Написать комментарий
                </button>
            ) : (
            <button
                onClick={handleShowAddComment}
                className={styles.addCommentButton}
                aria-expanded={showAddComment}
                aria-controls="add-comment-form"
            >
                Написать комментарий
            </button>
            )}
            {showAddComment &&  (
                <AddCommentForm
                    newsId={newsId}
                    authorName={authorName}
                    user={user}
                    onCancel={handleShowAddComment}
                />
            )}
        </div>
    );
});
