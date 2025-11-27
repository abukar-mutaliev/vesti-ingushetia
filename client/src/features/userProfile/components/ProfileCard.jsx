import styles from '../ui/UserProfile.module.scss';
import { FaUpload } from 'react-icons/fa';
import defaultAvatar from '@assets/default-avatar.jpg';
import { RiLogoutBoxLine } from 'react-icons/ri';
import { FiSettings } from 'react-icons/fi';

export const ProfileCard = ({
    user,
    isAdmin,
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
            : null;

    return (
        <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
                <div className={styles.buttonsContainer}>
                    {isAdmin && (
                        <button
                            className={styles.adminPanelButton}
                            onClick={handleAdminPanel}
                        >
                            Панель Администратора
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className={styles.logOutButton}
                    >
                        <RiLogoutBoxLine size={30} />
                    </button>
                </div>
                <div className={styles.avatarContainer}>
                    <img
                        src={
                            user.avatarUrl ? `${user.avatarUrl}` : defaultAvatar
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
                <button
                    className={styles.editProfileButton}
                    onClick={handleEditProfile}
                >
                    <FiSettings size={18} />
                    Редактировать профиль
                </button>
            </div>
        </div>
    );
};
