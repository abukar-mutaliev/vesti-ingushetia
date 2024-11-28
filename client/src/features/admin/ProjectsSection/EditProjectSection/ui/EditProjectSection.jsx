import React, { useState, useEffect } from 'react';
import styles from './EditProjectSection.module.scss';
import { useDispatch } from 'react-redux';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import {
    updateProject,
    fetchAllProjects,
} from '@entities/projects/model/projectSlice.js';
import { FaDeleteLeft } from 'react-icons/fa6';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';

export const EditProjectSection = ({ project, onCancel }) => {
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editMedia, setEditMedia] = useState([]);
    const [newMedia, setNewMedia] = useState([]);
    const [errors, setErrors] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState(null);
    const dispatch = useDispatch();

    useEffect(() => {
        if (project) {
            setEditTitle(project.title || '');
            setEditContent(project.content || '');
            setEditMedia(project.mediaFiles || []);
        }
        dispatch(fetchCategories());
    }, [project, dispatch]);

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        setNewMedia((prevMedia) => [...prevMedia, ...files]);
    };

    const handleDeleteMedia = (index) => {
        setMediaToDelete(index);
        setIsModalOpen(true);
    };

    const confirmDeleteMedia = () => {
        setEditMedia((prevMedia) =>
            prevMedia.filter((_, i) => i !== mediaToDelete),
        );
        setIsModalOpen(false);
        setMediaToDelete(null);
    };

    const validateFields = () => {
        const newErrors = {};

        if (!editTitle.trim()) {
            newErrors.title = 'Поле заголовка обязательно для заполнения.';
        } else if (editTitle.trim().length < 5) {
            newErrors.title = 'Заголовок должен быть не менее 5 символов.';
        }

        if (!editContent.trim()) {
            newErrors.content = 'Поле содержания обязательно для заполнения.';
        } else if (editContent.trim().length < 20) {
            newErrors.content = 'Содержание должно быть не менее 20 символов.';
        }
        const totalMediaCount = editMedia.length + newMedia.length;
        if (totalMediaCount === 0) {
            newErrors.media = 'Проект должен содержать хотя бы один медиафайл.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateFields()) return;

        const formData = new FormData();
        formData.append('title', editTitle);
        formData.append('content', editContent);

        formData.append(
            'existingMedia',
            JSON.stringify(editMedia.map((media) => media.id)),
        );

        newMedia.forEach((file) => {
            const mediaType = file.type.startsWith('image')
                ? 'images'
                : 'videos';
            formData.append(mediaType, file);
        });

        dispatch(updateProject({ id: project.id, projectData: formData }))
            .unwrap()
            .then(() => {
                dispatch(fetchAllProjects());
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
                    console.error('Ошибка при обновлении проекта:', error);
                }
            });
    };

    return (
        <div className={styles.editProjectSection}>
            <h2>Редактировать проект</h2>
            <div className={styles.editForm}>
                <label>Заголовок</label>
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                />
                {errors.title && <p className={styles.error}>{errors.title}</p>}

                <label>Содержание</label>
                <div className={styles.richTextEditor}>
                    <RichTextEditor
                        value={editContent}
                        onChange={setEditContent}
                    />
                    {errors.content && (
                        <p className={styles.error}>{errors.content}</p>
                    )}
                </div>

                {editMedia.length > 0 && (
                    <div>
                        <p>Существующие медиафайлы:</p>
                        {editMedia.map((media, index) => (
                            <div key={index} className={styles.mediaItem}>
                                {media.type.startsWith('image') ? (
                                    <img
                                        className={styles.media}
                                        src={`${media.url}`}
                                        alt="media"
                                    />
                                ) : (
                                    <video
                                        className={styles.media}
                                        src={`${media.url}`}
                                        controls
                                    />
                                )}
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDeleteMedia(index)}
                                >
                                    <FaDeleteLeft size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <label>Добавить новые медиафайлы</label>
                <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                />
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

            <ConfirmDeleteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmDeleteMedia}
            />
        </div>
    );
};
