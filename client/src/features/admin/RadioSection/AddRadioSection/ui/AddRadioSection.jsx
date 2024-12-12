import { useState } from 'react';
import styles from './AddRadioSection.module.scss';
import { useDispatch } from 'react-redux';
import {
    createRadio,
    fetchAllRadio,
} from '@entities/radio/model/radioSlice.js';
import { FaDeleteLeft } from 'react-icons/fa6';

export const AddRadioSection = ({ onSave, onCancel }) => {
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newAudio, setNewAudio] = useState([]);
    const [errors, setErrors] = useState({});
    const dispatch = useDispatch();

    const handleAudioChange = (e) => {
        const files = Array.from(e.target.files);
        setNewAudio((prevAudio) => {
            const updatedAudio = [...prevAudio, ...files];
            if (updatedAudio.length > 0) {
                setErrors((prevErrors) => {
                    const { audio, ...restErrors } = prevErrors;
                    return restErrors;
                });
            }
            return updatedAudio;
        });
    };

    const removeAudio = (index) => {
        setNewAudio((prevAudio) => {
            const updatedAudio = prevAudio.filter((_, i) => i !== index);
            if (updatedAudio.length === 0) {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    audio: 'Добавьте хотя бы один аудиофайл.',
                }));
            }
            return updatedAudio;
        });
    };

    const handleFieldChange = (field, value) => {
        if (field === 'title') {
            setNewTitle(value);
            if (value.trim().length > 0 && value.trim().length <= 100) {
                setErrors((prevErrors) => {
                    const { title, ...restErrors } = prevErrors;
                    return restErrors;
                });
            } else if (value.trim().length > 100) {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    title: 'Название не должно превышать 100 символов.',
                }));
            }
        }

        if (field === 'description') {
            setNewDescription(value);
            if (value.trim().length <= 500) {
                setErrors((prevErrors) => {
                    const { description, ...restErrors } = prevErrors;
                    return restErrors;
                });
            } else {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    description: 'Описание не должно превышать 500 символов.',
                }));
            }
        }
    };

    const validateFields = () => {
        const newErrors = {};

        if (!newTitle.trim()) {
            newErrors.title = 'Поле названия обязательно для заполнения.';
        } else if (newTitle.trim().length > 100) {
            newErrors.title = 'Название не должно превышать 100 символов.';
        }

        if (newDescription.trim().length > 500) {
            newErrors.description =
                'Описание не должно превышать 500 символов.';
        }

        if (newAudio.length === 0) {
            newErrors.audio = 'Добавьте хотя бы один аудиофайл.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateFields()) return;

        const formData = new FormData();
        formData.append('title', newTitle);
        formData.append('description', newDescription);

        newAudio.forEach((file) => {
            formData.append('audio', file);
        });

        dispatch(createRadio(formData))
            .unwrap()
            .then(() => {
                dispatch(fetchAllRadio());
                onSave();
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
                    console.error('Ошибка при создании радио:', error);
                }
            });
    };

    return (
        <div className={styles.addRadioSection}>
            <h2>Добавить радио</h2>
            <div className={styles.addForm}>
                <label>Название</label>
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                />
                {errors.title && <p className={styles.error}>{errors.title}</p>}

                <label>Описание</label>
                <textarea
                    value={newDescription}
                    onChange={(e) =>
                        handleFieldChange('description', e.target.value)
                    }
                />
                {errors.description && (
                    <p className={styles.error}>{errors.description}</p>
                )}

                <label>Аудиофайлы</label>
                <input
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleAudioChange}
                    className={styles.fileInput}
                />
                {errors.audio && <p className={styles.error}>{errors.audio}</p>}

                {newAudio.length > 0 && (
                    <div className={styles.audioPreview}>
                        {newAudio.map((file, index) => (
                            <div key={index} className={styles.previewItem}>
                                <audio
                                    controls
                                    src={URL.createObjectURL(file)}
                                />
                                <button
                                    type="button"
                                    className={styles.removeButton}
                                    onClick={() => removeAudio(index)}
                                >
                                    <FaDeleteLeft size={30} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

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
        </div>
    );
};
