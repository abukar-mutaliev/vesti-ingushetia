import { memo, useCallback, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { FaRegComments, FaChevronDown } from 'react-icons/fa';

export const CommentSection = memo(({ newsId, authorName, userId }) => {
    const dispatch = useDispatch();
    const loading = useSelector(selectCommentsLoading);
    const error = useSelector(selectCommentsError);
    const commentsSelector = useMemo(
        () => selectCommentsByNewsId(newsId),
        [newsId],
    );
    const comments = useSelector(commentsSelector, shallowEqual);
    const user = useSelector(selectUserAuth, shallowEqual);

    const [isCommentsVisible, setIsCommentsVisible] = useState(true);
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
                type="button"
                onClick={handleToggleComments}
                className={styles.toggleButton}
                aria-expanded={isCommentsVisible}
                aria-controls="comments-list"
            >
                <span className={styles.toggleLeft}>
                    <FaRegComments className={styles.toggleIcon} aria-hidden="true" />
                    <span className={styles.toggleTitle}>Комментарии</span>
                    <span className={styles.countBadge}>{comments.length}</span>
                </span>
                <FaChevronDown
                    className={`${styles.arrow} ${isCommentsVisible ? styles.arrowUp : ''}`}
                    aria-hidden="true"
                />
            </button>

            {isCommentsVisible && (
                <div className={styles.commentsBody}>
                    {loading ? (
                        <div className={styles.loaderWrap}>
                            <Loader />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className={styles.noComments}>
                            <div className={styles.noCommentsIcon} aria-hidden="true">
                                <FaRegComments size={28} />
                            </div>
                            <p className={styles.noCommentsTitle}>
                                Комментарии отсутствуют
                            </p>
                            <p className={styles.noCommentsText}>
                                Будьте первым — поделитесь мнением об этой новости
                            </p>
                        </div>
                    ) : (
                        <ul className={styles.commentList} id="comments-list">
                            {comments.map((comment) => (
                                <li key={comment.id} className={styles.commentListItem}>
                                    <CommentItem
                                        comment={comment}
                                        isReply={false}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div className={styles.actions}>
                {user === false ? (
                    <div className={styles.authHint}>
                        <button
                            type="button"
                            className={styles.addCommentButtonDisabled}
                            aria-expanded={showAddComment}
                            disabled
                        >
                            Написать комментарий
                        </button>
                        <p className={styles.authHintText}>
                            Для комментирования{' '}
                            <Link to="/login">войдите</Link> в аккаунт
                        </p>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={handleShowAddComment}
                        className={styles.addCommentButton}
                        aria-expanded={showAddComment}
                        aria-controls="add-comment-form"
                    >
                        {showAddComment ? 'Скрыть форму' : 'Написать комментарий'}
                    </button>
                )}
            </div>

            {showAddComment && user !== false && (
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
