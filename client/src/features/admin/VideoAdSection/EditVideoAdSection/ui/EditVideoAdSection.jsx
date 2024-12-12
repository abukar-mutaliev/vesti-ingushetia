import { useState, useEffect } from 'react';
import styles from './EditVideoAdSection.module.scss';
import { useDispatch } from 'react-redux';
import {
    updateVideoAd,
    fetchAllVideoAds,
} from '@entities/videoAd/model/videoAdSlice';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal';

export const EditVideoAdSection = ({ videoAd, onCancel }) => {
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editVideo, setEditVideo] = useState(null);
    const [expirationDate, setExpirationDate] = useState('');
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (videoAd) {
            setEditTitle(videoAd.title || '');
            setEditDescription(videoAd.description || '');
            setEditVideo(videoAd.url || null);
            setExpirationDate(videoAd.expirationDate || '');
        }
    }, [videoAd]);

    const handleVideoChange = (e) => {
        setEditVideo(e.target.files[0]);
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append('title', editTitle);
        formData.append('description', editDescription);
        formData.append('expirationDate', expirationDate);

        if (editVideo instanceof File) {
            formData.append('video', editVideo);
        }
        dispatch(updateVideoAd({ id: videoAd.id, videoAdData: formData }))
            .unwrap()
            .then(() => {
                dispatch(fetchAllVideoAds());
                onCancel();
            })
            .catch((error) => {
                setError(error);
                console.error('Ошибка при обновлении видеорекламы:', error);
            });
    };

    return (
        <div className={styles.editVideoAdSection}>
            <h2>Редактировать видеорекламу</h2>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.editForm}>
                <label>
                    Название{' '}
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                    />
                </label>

                <label>
                    Описание{' '}
                    <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                    />
                </label>

                <div className={styles.setExpirationDate}>
                    <label>
                        Срок истечения:{' '}
                        <input
                            type="date"
                            value={expirationDate.split('T')[0]}
                            onChange={(e) => setExpirationDate(e.target.value)}
                            className={styles.calendar}
                        />
                    </label>
                </div>
                <label>Видеофайл</label>
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className={styles.fileInput}
                />

                {editVideo && !editVideo.name && (
                    <div className={styles.videoPreview}>
                        <video controls src={editVideo} width="100%" />
                    </div>
                )}

                <div className={styles.buttons}>
                    <button className={styles.saveButton} onClick={handleSave}>
                        Сохранить
                    </button>
                    <button className={styles.cancelButton} onClick={onCancel}>
                        Отмена
                    </button>
                </div>
            </div>

            <ConfirmDeleteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => setEditVideo(null)}
            />
        </div>
    );
};
