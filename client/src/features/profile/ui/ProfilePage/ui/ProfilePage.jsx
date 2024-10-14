import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './ProfilePage.module.scss';
import {
    clearError,
    fetchUserProfile,
    fetchUserReplies,
    updateAvatar,
    logoutUser,
} from '@entities/user/auth/model/authSlice.js';
import defaultAvatar from '@assets/default-avatar.jpg';
import { FaUpload } from 'react-icons/fa';
import Modal from 'react-modal';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader } from '@shared/ui/Loader/index.js';
import { Link, useNavigate } from 'react-router-dom';
import {
    selectIsAdmin,
    selectUserAuth,
    selectUserReplies,
} from '@entities/user/auth/model/authSelectors.js';

Modal.setAppElement('#root');

export const ProfilePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading, error } = useSelector((state) => state.auth);
    const replies = useSelector(selectUserReplies);
    const fileInputRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isAuthenticated = useSelector(selectUserAuth);
    const isAdmin = useSelector(selectIsAdmin);
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    useEffect(() => {
        dispatch(fetchUserProfile())
            .unwrap()
            .then(() => {
                setIsAuthChecked(true);
            })
            .catch(() => {
                setIsAuthChecked(true);
            });

        dispatch(fetchUserReplies())
            .unwrap()
            .then((data) => {
                console.log('Replies data:', data);
            })
            .catch((err) => console.error('Ошибка получения ответов:', err));
    }, [dispatch]);

    const handleAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            dispatch(updateAvatar(file));
        }
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    const handleAdminPanel = () => {
        navigate('/admin/dashboard');
    };

    const handleAvatarClick = () => {
        setIsModalOpen(true);
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const formattedDate =
        user && user.createdAt
            ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
              })
            : null;

    if (!isAuthChecked) {
        return (
            <div>
                <Loader />
            </div>
        );
    }

    if (!isAuthenticated && !isAdmin) {
        return (
            <div className={styles.unAuthorized}>
                Вы не авторизованы, пожалуйста{' '}
                <Link to={'/login'}>пройдите авторизацию</Link>{' '}
            </div>
        );
    }

    return (
        <div className={styles.profileContainer}>
            {user && (
                <div className={styles.profileCard}>
                    <div className={styles.profileHeader}>
                        <div className={styles.buttonsContainer}>
                            {isAdmin && (
                                <button
                                    className={styles.adminPAnelButton}
                                    onClick={handleAdminPanel}
                                >
                                    Панель Администратора
                                </button>
                            )}
                            <button
                                className={styles.logOutButton}
                                onClick={handleLogout}
                            >
                                Выйти
                            </button>
                        </div>
                        <div className={styles.avatarContainer}>
                            <img
                                src={
                                    user.avatarUrl
                                        ? `http://localhost:5000/${user.avatarUrl}`
                                        : defaultAvatar
                                }
                                alt="Аватар пользователя"
                                className={styles.avatar}
                                onClick={handleAvatarClick}
                            />
                            <div
                                className={styles.uploadIcon}
                                onClick={handleUploadClick}
                            >
                                <FaUpload size={24} />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleAvatarChange}
                            />
                        </div>
                        <h2>{user.username}</h2>
                        <p className={styles.email}>{user.email}</p>
                        <div className={styles.stats}>
                            <div>
                                <span>Дата регистрации</span>
                                <strong>{formattedDate}</strong>
                            </div>
                        </div>
                    </div>
                    <div className={styles.repliesSection}>
                        <h3>Ответы на ваши комментарии</h3>
                        {replies.length > 0 ? (
                            <div className={styles.repliesList}>
                                {replies.map((reply) => (
                                    <div
                                        key={reply.id}
                                        className={styles.reply}
                                    >
                                        <div className={styles.replyHeader}>
                                            <img
                                                src={
                                                    reply.author &&
                                                    reply.author.avatarUrl
                                                        ? `http://localhost:5000/${reply.author.avatarUrl}`
                                                        : defaultAvatar
                                                }
                                                alt="Аватар автора"
                                                className={styles.replyAvatar}
                                            />
                                            <div className={styles.replyInfo}>
                                                <p
                                                    className={
                                                        styles.replyAuthor
                                                    }
                                                >
                                                    {reply.author
                                                        ? reply.author.username
                                                        : reply.authorName ||
                                                          'Аноним'}
                                                </p>
                                                <p className={styles.replyDate}>
                                                    {formatDistanceToNow(
                                                        new Date(
                                                            reply.createdAt,
                                                        ),
                                                        {
                                                            addSuffix: true,
                                                            locale: ru,
                                                        },
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <p className={styles.replyContent}>
                                            {reply.content}
                                        </p>
                                        <a
                                            href={`/news/${reply.newsId}`}
                                            className={styles.replyLink}
                                        >
                                            Перейти к новости
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>У вас нет новых ответов.</p>
                        )}
                    </div>
                </div>
            )}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                className={styles.modalContent}
                overlayClassName={styles.modalOverlay}
                contentLabel="Просмотр аватара"
            >
                <button className={styles.closeButton} onClick={closeModal}>
                    ×
                </button>
                <img
                    src={
                        user && user.avatarUrl
                            ? `http://localhost:5000/${user.avatarUrl}`
                            : defaultAvatar
                    }
                    alt="Аватар пользователя"
                    className={styles.modalImage}
                />
            </Modal>
        </div>
    );
};
