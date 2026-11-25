import styles from '../ui/UserProfile.module.scss';
import { FaUpload } from 'react-icons/fa';
import defaultAvatar from '@assets/default-avatar.jpg';
import { RiLogoutBoxLine } from 'react-icons/ri';
import { FiSettings } from 'react-icons/fi';

export const ProfileCard = ({
    user,
    isAdmin,
    repliesCount,
    handleAdminPanel,
    handleLogout,
    handleAvatarClick,
    handleUploadClick,
    fileInputRef,
    handleAvatarChange,
    handleEditProfile,
}) => {
    const formattedDate =
        user && user.createdAt
            ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
              })
            : '—';

    return (
        <section className={styles.profileCard}>
            <div className={styles.profileHeader}>
                <div className={styles.headerActions}>
                    {isAdmin && (
                        <button
                            type="button"
                            className={styles.adminPanelButton}
                            onClick={handleAdminPanel}
                        >
                            Панель администратора
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className={styles.logOutButton}
                        aria-label="Выйти"
                    >
                        <RiLogoutBoxLine size={18} />
                        Выйти
                    </button>
                </div>

                <div className={styles.identity}>
                    <div className={styles.avatarContainer}>
                        <img
                            src={user.avatarUrl || defaultAvatar}
                            alt="Аватар пользователя"
                            className={styles.avatar}
                            onClick={handleAvatarClick}
                        />
                        <button
                            type="button"
                            className={styles.uploadIcon}
                            onClick={handleUploadClick}
                            aria-label="Загрузить аватар"
                        >
                            <FaUpload size={14} />
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className={styles.fileInput}
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <div className={styles.identityText}>
                        <span className={styles.role}>
                            {isAdmin ? 'Администратор' : 'Читатель'}
                        </span>
                        <h1>{user.username}</h1>
                        <p className={styles.email}>{user.email}</p>
                        <button
                            type="button"
                            className={styles.editProfileButton}
                            onClick={handleEditProfile}
                        >
                            <FiSettings size={16} />
                            Редактировать профиль
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.stats}>
                <div>
                    <span>На сайте с</span>
                    <strong>{formattedDate}</strong>
                </div>
                <div>
                    <span>Ответы</span>
                    <strong>{repliesCount}</strong>
                </div>
                <div>
                    <span>Роль</span>
                    <strong>{isAdmin ? 'Админ' : 'Читатель'}</strong>
                </div>
            </div>
        </section>
    );
};
