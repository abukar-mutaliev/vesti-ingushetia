import React from 'react';
import Modal from 'react-modal';
import styles from '../ui/UserProfile.module.scss';
import defaultAvatar from '@assets/default-avatar.jpg';

Modal.setAppElement('#root');

export const AvatarModal = ({ isModalOpen, closeModal, avatarUrl }) => {
    const customStyles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
        },
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '20px'
        }
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onRequestClose={closeModal}
            style={customStyles}
            contentLabel="Просмотр аватара"
        >
            <div className={styles.modalContent}>
                <button className={styles.closeButton} onClick={closeModal}>
                    ×
                </button>
                <img
                    src={avatarUrl || defaultAvatar}
                    alt="Аватар пользователя"
                    className={styles.modalImage}
                />
            </div>
        </Modal>
    );
};