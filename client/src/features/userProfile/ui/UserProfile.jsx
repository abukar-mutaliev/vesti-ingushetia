import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './UserProfile.module.scss';
import {
    fetchUserProfile,
    fetchUserReplies,
    updateAvatar,
    logoutUser,
} from '@entities/user/auth/model/authSlice';
import {
    selectIsAdmin,
    selectUserAuth,
    selectUserReplies,
} from '@entities/user/auth/model/authSelectors';
import { Loader } from '@shared/ui/Loader';
import { Link, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { ProfileCard } from '@features/userProfile/components/ProfileCard.jsx';
import { RepliesList } from '@features/userProfile/components/RepliesList.jsx';
import { AvatarModal } from '@features/userProfile/components/AvatarModal.jsx';
import { EditProfileModal } from '@features/userProfile/components/EditProfileModal.jsx';
import { FiCheck } from 'react-icons/fi';

Modal.setAppElement('#root');

export const UserProfile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading } = useSelector((state) => state.auth);
    const replies = useSelector(selectUserReplies);
    const fileInputRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    const isAuthenticated = useSelector(selectUserAuth);
    const isAdmin = useSelector(selectIsAdmin);
    const rehydrated = useSelector((state) => state._persist?.rehydrated);

    useEffect(() => {
        if (rehydrated) {
            dispatch(fetchUserProfile());
            dispatch(fetchUserReplies());
        }
    }, [dispatch, rehydrated]);

    if (!rehydrated || loading) {
        return <Loader />;
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.unAuthorized}>
                Вы не авторизованы, пожалуйста{' '}
                <Link to={'/login'}>пройдите авторизацию</Link>
            </div>
        );
    }

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

    const handleEditProfile = () => {
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
    };

    const handleSaveSuccess = (message) => {
        setIsEditModalOpen(false);
        setToast({ show: true, message });
        setTimeout(() => {
            setToast({ show: false, message: '' });
        }, 3000);
    };

    return (
        <div className={styles.profileContainer}>
            {user && (
                <>
                    <ProfileCard
                        user={user}
                        isAdmin={isAdmin}
                        handleAdminPanel={handleAdminPanel}
                        handleLogout={handleLogout}
                        handleAvatarClick={handleAvatarClick}
                        handleUploadClick={handleUploadClick}
                        fileInputRef={fileInputRef}
                        handleAvatarChange={handleAvatarChange}
                        handleEditProfile={handleEditProfile}
                    />
                    <RepliesList replies={replies} />
                    <AvatarModal
                        isModalOpen={isModalOpen}
                        closeModal={closeModal}
                        avatarUrl={user.avatarUrl}
                    />
                    <EditProfileModal
                        isOpen={isEditModalOpen}
                        onClose={closeEditModal}
                        onSaveSuccess={handleSaveSuccess}
                        user={user}
                    />
                </>
            )}
            {toast.show && (
                <div className={styles.toast}>
                    <FiCheck size={20} />
                    {toast.message}
                </div>
            )}
        </div>
    );
};
