import React, { useState, useCallback, memo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styles from './Comment.module.scss';
import defaultAvatar from '@assets/default-avatar.jpg';
import { BiLike, BiSolidLike } from 'react-icons/bi';
import {
    likeComment,
    deleteComment,
} from '@entities/comments/model/commentsSlice';
import { AddReplyForm } from '@features/comments/AddReplyForm/';
import {
    selectUserAuth,
    selectIsAdmin,
} from '@entities/user/auth/model/authSelectors.js';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal';

export const CommentItem = memo(({ comment, isReply }) => {
    const dispatch = useDispatch();
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const user = useSelector(selectUserAuth, shallowEqual);
    const isAdmin = useSelector(selectIsAdmin);

    const avatarUrl =
        comment.authorDetails && comment.authorDetails.avatarUrl
            ? `http://localhost:5000/${comment.authorDetails.avatarUrl}`
            : defaultAvatar;

    const handleLike = useCallback(() => {
        if (!user) return;
        dispatch(likeComment(comment.id));
    }, [dispatch, comment.id, user]);

    const toggleReplyForm = useCallback(() => {
        if (!user) return;
        setShowReplyForm((prev) => !prev);
    }, [user]);

    const handleDeleteClick = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        dispatch(deleteComment(comment.id));
        setIsModalOpen(false);
    }, [dispatch, comment.id]);

    const handleCancelDelete = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    return (
        <div className={`${styles.comment} ${isReply ? styles.reply : ''}`}>
            <img src={`${avatarUrl}`} alt="Avatar" className={styles.avatar} />
            <div className={styles.commentContent}>
                <span className={styles.authorName}>{comment.authorName}</span>
                <div>
                    <span className={styles.commentText}>
                        {comment.content}
                    </span>
                </div>
                <div className={styles.commentActions}>
                    <button
                        className={styles.likeButton}
                        onClick={handleLike}
                        disabled={!user}
                        title={!user ? 'Войдите, чтобы поставить лайк' : ''}
                    >
                        {comment.likedByCurrentUser ? (
                            <BiSolidLike />
                        ) : (
                            <BiLike />
                        )}
                    </button>
                    <span className={styles.likesCount}>
                        {typeof comment.likesCount === 'number'
                            ? comment.likesCount
                            : 0}
                    </span>
                    {!isReply && (
                        <button
                            className={styles.replyButton}
                            onClick={toggleReplyForm}
                            disabled={!user}
                            title={!user ? 'Войдите, чтобы ответить' : ''}
                        >
                            Ответить
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            className={styles.deleteButton}
                            onClick={handleDeleteClick}
                        >
                            Удалить
                        </button>
                    )}
                </div>
                {showReplyForm && (
                    <AddReplyForm
                        parentId={comment.id}
                        onCancel={toggleReplyForm}
                    />
                )}
                {comment.replies && comment.replies.length > 0 && (
                    <div className={styles.replies}>
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                isReply={true}
                            />
                        ))}
                    </div>
                )}
                {isModalOpen && (
                    <ConfirmDeleteModal
                        isOpen={isModalOpen}
                        onClose={handleCancelDelete}
                        onConfirm={handleConfirmDelete}
                    />
                )}
            </div>
        </div>
    );
});
