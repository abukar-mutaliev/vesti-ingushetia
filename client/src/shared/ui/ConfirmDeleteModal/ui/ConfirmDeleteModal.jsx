import Modal from 'react-modal';
import styles from './ConfirmDeleteModal.module.scss';

export const ConfirmDeleteModal = ({
    isOpen,
    onClose,
    onConfirm,
    description,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Подтверждение удаления"
            className={styles.confirmModal}
            overlayClassName={styles.modalOverlay}
        >
            {description ? (
                <div>
                    <h3>{description}</h3>
                    <div className={styles.buttons}>
                        <button
                            className={styles.confirmButton}
                            onClick={onConfirm}
                        >
                            Да
                        </button>
                        <button
                            className={styles.cancelButton}
                            onClick={onClose}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <h2>Вы уверены, что хотите удалить?</h2>
                    <div className={styles.buttons}>
                        <button
                            className={styles.confirmButton}
                            onClick={onConfirm}
                        >
                            Удалить
                        </button>
                        <button
                            className={styles.cancelButton}
                            onClick={onClose}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
