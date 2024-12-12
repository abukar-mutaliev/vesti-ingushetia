import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './UsersSection.module.scss';
import {
    selectAuthError,
    selectLoading,
    selectUser,
    selectUsers,
} from '@entities/user/auth/model/authSelectors.js';
import {
    fetchAllUsers,
    updateUserRole,
} from '@entities/user/auth/model/authSlice.js';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal';

export const UsersSection = () => {
    const dispatch = useDispatch();
    const users = useSelector(selectUsers);
    const loading = useSelector(selectLoading);
    const error = useSelector(selectAuthError);
    const currentUser = useSelector(selectUser);

    const [isMakeAdminModalOpen, setIsMakeAdminModalOpen] = useState(false);
    const [isRevokeAdminModalOpen, setIsRevokeAdminModalOpen] = useState(false);
    const [userIdToUpdateRole, setUserIdToUpdateRole] = useState(null);
    const [isAdminAction, setIsAdminAction] = useState(false);

    useEffect(() => {
        dispatch(fetchAllUsers());
    }, [dispatch]);

    if (loading) {
        return <p>Загрузка...</p>;
    }

    if (error) {
        return <p>Ошибка: {error}</p>;
    }

    const openMakeAdminModal = (userId) => {
        setUserIdToUpdateRole(userId);
        setIsAdminAction(true);
        setIsMakeAdminModalOpen(true);
    };

    const openRevokeAdminModal = (userId) => {
        setUserIdToUpdateRole(userId);
        setIsAdminAction(false);
        setIsRevokeAdminModalOpen(true);
    };

    const closeAdminModal = () => {
        setIsMakeAdminModalOpen(false);
        setIsRevokeAdminModalOpen(false);
        setUserIdToUpdateRole(null);
    };

    const handleUpdateUserRole = () => {
        if (userIdToUpdateRole !== null) {
            dispatch(
                updateUserRole({
                    userId: userIdToUpdateRole,
                    isAdmin: isAdminAction,
                }),
            )
                .unwrap()
                .then(() => {
                    dispatch(fetchAllUsers());
                    closeAdminModal();
                })
                .catch((error) => {
                    console.error(
                        `Ошибка при ${isAdminAction ? 'назначении' : 'отзыве'} администратора:`,
                        error,
                    );
                });
        }
    };
    const sortedUsers = [...users].sort((a, b) => b.isAdmin - a.isAdmin);

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Пользователи</h1>
            </div>
            <div className={styles.tableContainer}>
                {users &&
                    sortedUsers.map((user) => (
                        <div className={styles.userCard} key={user.id}>
                            <div className={styles.userField}>
                                <strong>Id:</strong> {user.id}
                            </div>
                            <div className={styles.userField}>
                                <strong>Имя пользователя:</strong>{' '}
                                {user.username}
                            </div>
                            <div className={styles.userField}>
                                <strong>Email:</strong> {user.email}
                            </div>
                            <div className={styles.userField}>
                                <strong>Роль:</strong>{' '}
                                {user.isAdmin
                                    ? 'Администратор'
                                    : 'Пользователь'}
                                <div className={styles.actions}>
                                    {user.isAdmin ? (
                                        user.id !== currentUser.id && (
                                            <button
                                                className={
                                                    styles.revokeAdminButton
                                                }
                                                onClick={() =>
                                                    openRevokeAdminModal(
                                                        user.id,
                                                    )
                                                }
                                            >
                                                Отозвать права
                                            </button>
                                        )
                                    ) : (
                                        <button
                                            className={styles.makeAdminButton}
                                            onClick={() =>
                                                openMakeAdminModal(user.id)
                                            }
                                        >
                                            Назначить администратором
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>

            <ConfirmDeleteModal
                isOpen={isMakeAdminModalOpen}
                onClose={closeAdminModal}
                onConfirm={handleUpdateUserRole}
                title="Назначить администратора"
                description="Вы уверены, что хотите назначить этого пользователя администратором?"
            />

            <ConfirmDeleteModal
                isOpen={isRevokeAdminModalOpen}
                onClose={closeAdminModal}
                onConfirm={handleUpdateUserRole}
                title="Отозвать права администратора"
                description="Вы уверены, что хотите отозвать права администратора у этого пользователя?"
            />
        </div>
    );
};
