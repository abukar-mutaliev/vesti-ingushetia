import React from 'react';
import Modal from 'react-modal';
import styles from '../ui/UserProfile.module.scss';
import defaultAvatar from '@assets/default-avatar.jpg';

export const AvatarModal = ({ isModalOpen, closeModal, avatarUrl }) => {
    return (
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
                src={avatarUrl ? `${avatarUrl}` : defaultAvatar}
                alt="Аватар пользователя"
                className={styles.modalImage}
            />
        </Modal>
    );
};
