import React, { useState, useEffect } from 'react';
import styles from './AddVideoAdSection.module.scss';
import { useDispatch } from 'react-redux';
import {
    createVideoAd,
    fetchAllVideoAds,
} from '@entities/videoAd/model/videoAdSlice';
import { FaDeleteLeft } from 'react-icons/fa6';

export const AddVideoAdSection = ({ onSave, onCancel }) => {
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newVideo, setNewVideo] = useState(null);
    const [expirationDate, setExpirationDate] = useState('');
    const [errors, setErrors] = useState({});
    const dispatch = useDispatch();

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewVideo(file);
        } else {
            setNewVideo(null);
        }
    };

    const handleRemoveVideo = () => {
        setNewVideo(null);
    };

    const validateFields = () => {
        const newErrors = {};

        if (!newTitle.trim()) {
            newErrors.title = 'Поле заголовка обязательно для заполнения.';
        }
        if (!newDescription.trim()) {
            newErrors.description = 'Поле описания обязательно для заполнения.';
        }
        if (!newVideo) {
            newErrors.video = 'Добавьте видеофайл.';
        }
        if (!expirationDate) {
            newErrors.expirationDate =
                'Поле даты истечения обязательно для заполнения.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateFields()) return;

        const formData = new FormData();
        formData.append('title', newTitle);
        formData.append('description', newDescription);
        formData.append('video', newVideo);
        formData.append('expirationDate', expirationDate);

        dispatch(createVideoAd(formData))
            .unwrap()
            .then(() => {
                dispatch(fetchAllVideoAds());
                onSave();
            })
            .catch((error) => {
                if (error?.errors) {
                    const serverErrors = error.errors.reduce((acc, err) => {
                        if (err.path) acc[err.path] = err.msg;
                        return acc;
                    }, {});
                    setErrors(serverErrors);
                } else {
                    console.error('Ошибка при создании видеорекламы:', error);
                }
            });
    };

    useEffect(() => {
        return () => {
            if (newVideo && typeof newVideo === 'string') {
                URL.revokeObjectURL(newVideo);
            }
        };
    }, [newVideo]);

    return (
        <div className={styles.addVideoAdSection}>
            <h2>Добавить видеорекламу</h2>
            <div className={styles.addForm}>
                <label>Название</label>
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => {
                        setNewTitle(e.target.value);
                        setErrors((prev) => ({ ...prev, title: '' })); // Убираем ошибку при изменении поля
                    }}
                />
                {errors.title && <p className={styles.error}>{errors.title}</p>}

                <label>Описание</label>
                <textarea
                    value={newDescription}
                    onChange={(e) => {
                        setNewDescription(e.target.value);
                        setErrors((prev) => ({ ...prev, description: '' }));
                    }}
                />
                {errors.description && (
                    <p className={styles.error}>{errors.description}</p>
                )}
                <label htmlFor="date">
                    Срок размещения:{' '}
                    <input
                        id="date"
                        type="date"
                        value={expirationDate}
                        onChange={(e) => {
                            setExpirationDate(e.target.value);
                            setErrors((prev) => ({
                                ...prev,
                                expirationDate: '',
                            }));
                        }}
                    />
                </label>

                {errors.expirationDate && (
                    <p className={styles.error}>{errors.expirationDate}</p>
                )}

                <label>Видеофайл</label>
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className={styles.fileInput}
                />
                {errors.video && <p className={styles.error}>{errors.video}</p>}

                {newVideo && typeof newVideo !== 'string' && (
                    <div className={styles.videoPreview}>
                        <button
                            className={styles.removeButton}
                            onClick={handleRemoveVideo}
                        >
                            <FaDeleteLeft />
                        </button>
                        <video controls src={URL.createObjectURL(newVideo)} />
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
        </div>
    );
};
