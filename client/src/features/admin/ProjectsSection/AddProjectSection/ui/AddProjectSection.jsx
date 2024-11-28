import React, { useState, useEffect } from 'react';
import styles from './AddProjectSection.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import {
    createProject,
    fetchAllProjects,
} from '@entities/projects/model/projectSlice.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';
import { FaDeleteLeft } from 'react-icons/fa6';

export const AddProjectSection = ({ onSave, onCancel }) => {
    const [projectTitle, setProjectTitle] = useState('');
    const [projectContent, setProjectContent] = useState('');
    const [projectMedia, setProjectMedia] = useState([[]]);
    const [errors, setErrors] = useState({});
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleMediaChange = (e, index) => {
        const files = Array.from(e.target.files);
        setProjectMedia((prevMedia) => {
            const updatedMedia = [...prevMedia];
            updatedMedia[index] = files;
            return updatedMedia;
        });
    };

    const addNewMediaField = () => {
        setProjectMedia([...projectMedia, []]);
    };

    const removeMedia = (mediaIndex, fileIndex) => {
        setProjectMedia((prevMedia) =>
            prevMedia.map((mediaGroup, i) =>
                i === mediaIndex
                    ? mediaGroup.filter((_, j) => j !== fileIndex)
                    : mediaGroup,
            ),
        );
    };

    const validateFields = () => {
        const newErrors = {};
        if (!projectTitle.trim()) {
            newErrors.title = 'Поле заголовка обязательно для заполнения.';
        } else if (projectTitle.trim().length < 5) {
            newErrors.title = 'Заголовок должен быть не менее 5 символов.';
        }

        if (!projectContent.trim()) {
            newErrors.content = 'Поле содержания обязательно для заполнения.';
        } else if (projectContent.trim().length < 20) {
            newErrors.content = 'Содержание должно быть не менее 20 символов.';
        }

        const hasMedia = projectMedia.some(
            (mediaGroup) => mediaGroup.length > 0,
        );
        if (!hasMedia) {
            newErrors.media = 'Добавьте хотя бы один файл.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateFields()) return;

        const formData = new FormData();
        formData.append('title', projectTitle);
        formData.append('content', projectContent);

        projectMedia.flat().forEach((file) => {
            if (file.type.startsWith('image')) {
                formData.append('images', file);
            } else if (file.type.startsWith('video')) {
                formData.append('videos', file);
            }
        });

        dispatch(createProject(formData))
            .unwrap()
            .then(() => {
                dispatch(fetchAllProjects());
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
                    console.error('Ошибка при создании проекта:', error);
                }
            });
    };

    return (
        <div className={styles.addProjectSection}>
            <h2>Добавить проект</h2>
            <div className={styles.addForm}>
                <label>Заголовок</label>
                <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                />
                {errors.title && <p className={styles.error}>{errors.title}</p>}

                <label>Содержание</label>
                <RichTextEditor
                    value={projectContent}
                    onChange={setProjectContent}
                />
                {errors.content && (
                    <p className={styles.error}>{errors.content}</p>
                )}

                <label>Медиафайлы</label>
                {projectMedia.map((mediaGroup, index) => (
                    <div key={index} className={styles.mediaGroup}>
                        <input
                            type="file"
                            multiple
                            onChange={(e) => handleMediaChange(e, index)}
                            className={styles.fileInput}
                        />
                        <div className={styles.mediaPreview}>
                            {mediaGroup.map((file, fileIndex) => (
                                <div
                                    key={fileIndex}
                                    className={styles.previewItem}
                                >
                                    <button
                                        type="button"
                                        className={styles.removeButton}
                                        onClick={() =>
                                            removeMedia(index, fileIndex)
                                        }
                                    >
                                        <FaDeleteLeft />
                                    </button>
                                    {file.type.startsWith('image') ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            className={styles.imagePreview}
                                        />
                                    ) : (
                                        <video
                                            controls
                                            src={URL.createObjectURL(file)}
                                            className={styles.videoPreview}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    className={styles.addButton}
                    onClick={addNewMediaField}
                >
                    + Добавить еще файлы
                </button>
                {errors.media && <p className={styles.error}>{errors.media}</p>}

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
