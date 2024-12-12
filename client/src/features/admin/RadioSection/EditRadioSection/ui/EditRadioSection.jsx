import { useState, useEffect } from 'react';
import styles from './EditRadioSection.module.scss';
import { useDispatch } from 'react-redux';
import { updateRadio, fetchAllRadio } from '@entities/radio/model/radioSlice';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal';
import { FaDeleteLeft } from 'react-icons/fa6';

export const EditRadioSection = ({ radio, onCancel }) => {
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editAudio, setEditAudio] = useState(null);
    const [errors, setErrors] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (radio) {
            setEditTitle(radio.title || '');
            setEditDescription(radio.description || '');
            if (radio.url) {
                setEditAudio({ url: radio.url });
            }
        }
    }, [radio]);

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        setEditAudio(file);
        if (file) {
            setErrors((prevErrors) => {
                const { audio, ...rest } = prevErrors;
                return rest;
            });
        }
    };

    const handleDeleteAudio = () => {
        setIsModalOpen(true);
    };

    const confirmDeleteAudio = () => {
        setEditAudio(null);
        setIsModalOpen(false);
        setErrors((prevErrors) => ({
            ...prevErrors,
            audio: 'Добавьте аудиофайл.',
        }));
    };

    const validateFields = () => {
        const newErrors = {};

        if (!editTitle.trim()) {
            newErrors.title = 'Поле названия обязательно для заполнения.';
        } else if (editTitle.trim().length > 100) {
            newErrors.title = 'Название не должно превышать 100 символов.';
        }

        if (editDescription.trim().length > 500) {
            newErrors.description =
                'Описание не должно превышать 500 символов.';
        }

        if (!editAudio) {
            newErrors.audio = 'Добавьте аудиофайл.';
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateFields()) return;

        const formData = new FormData();
        formData.append('title', editTitle);
        formData.append('description', editDescription);

        if (editAudio instanceof File) {
            formData.append('audio', editAudio);
        } else if (editAudio && editAudio.url) {
            formData.append('existingAudio', true);
        }

        dispatch(updateRadio({ id: radio.id, formData }))
            .unwrap()
            .then(() => {
                dispatch(fetchAllRadio());
                onCancel();
            })
            .catch((error) => {
                if (error.errors) {
                    const serverErrors = {};
                    error.errors.forEach((err) => {
                        if (err.path) {
                            serverErrors[err.path] = err.msg;
                        }
                    });
                    setErrors(serverErrors);
                } else {
                    console.error('Ошибка при обновлении радио:', error);
                }
            });
    };

    return (
        <div className={styles.editRadioSection}>
            <h2>Редактировать радио</h2>
            <div className={styles.editForm}>
                <label>Название</label>
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => {
                        setEditTitle(e.target.value);
                        if (e.target.value.trim()) {
                            setErrors((prevErrors) => {
                                const { title, ...rest } = prevErrors;
                                return rest;
                            });
                        }
                    }}
                />
                {errors.title && <p className={styles.error}>{errors.title}</p>}

                <label>Описание</label>
                <textarea
                    value={editDescription}
                    onChange={(e) => {
                        setEditDescription(e.target.value);
                        if (e.target.value.trim()) {
                            setErrors((prevErrors) => {
                                const { description, ...rest } = prevErrors;
                                return rest;
                            });
                        }
                    }}
                />
                {errors.description && (
                    <p className={styles.error}>{errors.description}</p>
                )}

                <label>Аудиофайл</label>
                {editAudio ? (
                    <div className={styles.audioItem}>
                        {editAudio.url ? (
                            <audio controls src={editAudio.url} />
                        ) : (
                            <p>Файл загружен: {editAudio.name}</p>
                        )}
                        <button
                            className={styles.deleteButton}
                            onClick={handleDeleteAudio}
                        >
                            <FaDeleteLeft size={20} />
                        </button>
                    </div>
                ) : (
                    <p>Нет загруженного аудиофайла</p>
                )}
                {errors.audio && <p className={styles.error}>{errors.audio}</p>}

                <label>Загрузить новый аудиофайл</label>
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioChange}
                />

                <div className={styles.buttons}>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={Object.keys(errors).length > 0}
                    >
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
                onConfirm={confirmDeleteAudio}
            />
        </div>
    );
};
