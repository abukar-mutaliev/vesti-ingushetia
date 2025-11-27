import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-modal';
import styles from './EditProfileModal.module.scss';
import {
    updateUserProfile,
    changePassword,
    clearError,
    clearSuccess,
} from '@entities/user/auth/model/authSlice';
import { FiUser, FiMail, FiLock, FiX, FiEye, FiEyeOff } from 'react-icons/fi';

export const EditProfileModal = ({ isOpen, onClose, onSaveSuccess, user }) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        username: user?.username || '',
        email: user?.email || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [localError, setLocalError] = useState('');

    // Синхронизируем данные при открытии модала
    useEffect(() => {
        if (isOpen && user) {
            setProfileData({
                username: user.username || '',
                email: user.email || '',
            });
            setLocalError('');
        }
    }, [isOpen, user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name]: value }));
        setLocalError('');
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
        setLocalError('');
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const validateProfile = () => {
        if (!profileData.username.trim()) {
            setLocalError('Имя пользователя обязательно');
            return false;
        }
        if (profileData.username.length < 3 || profileData.username.length > 30) {
            setLocalError('Имя пользователя должно содержать от 3 до 30 символов');
            return false;
        }
        if (!/^[a-zA-Zа-яА-ЯёЁ0-9_ ]+$/.test(profileData.username)) {
            setLocalError('Имя может содержать только буквы, цифры, пробелы и _');
            return false;
        }
        if (!profileData.email.trim()) {
            setLocalError('Email обязателен');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
            setLocalError('Некорректный формат email');
            return false;
        }
        return true;
    };

    const validatePassword = () => {
        if (!passwordData.currentPassword) {
            setLocalError('Введите текущий пароль');
            return false;
        }
        if (!passwordData.newPassword) {
            setLocalError('Введите новый пароль');
            return false;
        }
        if (passwordData.newPassword.length < 8) {
            setLocalError('Пароль должен содержать минимум 8 символов');
            return false;
        }
        if (!/[A-Z]/.test(passwordData.newPassword)) {
            setLocalError('Пароль должен содержать заглавную букву');
            return false;
        }
        if (!/[a-z]/.test(passwordData.newPassword)) {
            setLocalError('Пароль должен содержать строчную букву');
            return false;
        }
        if (!/\d/.test(passwordData.newPassword)) {
            setLocalError('Пароль должен содержать цифру');
            return false;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)) {
            setLocalError('Пароль должен содержать специальный символ');
            return false;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setLocalError('Пароли не совпадают');
            return false;
        }
        return true;
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!validateProfile()) return;

        try {
            const result = await dispatch(
                updateUserProfile({
                    userId: user.id,
                    userData: profileData,
                })
            ).unwrap();
            
            if (result) {
                onSaveSuccess('Профиль успешно обновлён!');
            }
        } catch (err) {
            setLocalError(err || 'Ошибка обновления профиля');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!validatePassword()) return;

        try {
            await dispatch(
                changePassword({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                    confirmPassword: passwordData.confirmPassword,
                })
            ).unwrap();
            
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            onSaveSuccess('Пароль успешно изменён!');
        } catch (err) {
            setLocalError(err || 'Ошибка смены пароля');
        }
    };

    const handleClose = () => {
        dispatch(clearError());
        dispatch(clearSuccess());
        setLocalError('');
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
            className={styles.modalContent}
            overlayClassName={styles.modalOverlay}
            contentLabel="Редактирование профиля"
        >
            <button className={styles.closeButton} onClick={handleClose}>
                <FiX size={24} />
            </button>

            <h2 className={styles.modalTitle}>Настройки профиля</h2>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
                    onClick={() => {
                        setActiveTab('profile');
                        setLocalError('');
                    }}
                >
                    <FiUser /> Профиль
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'password' ? styles.active : ''}`}
                    onClick={() => {
                        setActiveTab('password');
                        setLocalError('');
                    }}
                >
                    <FiLock /> Пароль
                </button>
            </div>

            {(localError || error) && (
                <div className={styles.errorMessage}>
                    {localError || error}
                </div>
            )}

            {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">
                            <FiUser /> Имя пользователя
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={profileData.username}
                            onChange={handleProfileChange}
                            placeholder="Введите имя пользователя"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">
                            <FiMail /> Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            placeholder="Введите email"
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                </form>
            )}

            {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="currentPassword">
                            <FiLock /> Текущий пароль
                        </label>
                        <div className={styles.passwordInput}>
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="Введите текущий пароль"
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => togglePasswordVisibility('current')}
                            >
                                {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="newPassword">
                            <FiLock /> Новый пароль
                        </label>
                        <div className={styles.passwordInput}>
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Введите новый пароль"
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => togglePasswordVisibility('new')}
                            >
                                {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                        <small className={styles.hint}>
                            Минимум 8 символов, заглавные и строчные буквы, цифры и спецсимволы
                        </small>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="confirmPassword">
                            <FiLock /> Подтвердите пароль
                        </label>
                        <div className={styles.passwordInput}>
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Повторите новый пароль"
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => togglePasswordVisibility('confirm')}
                            >
                                {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Сохранение...' : 'Изменить пароль'}
                    </button>
                </form>
            )}
        </Modal>
    );
};

