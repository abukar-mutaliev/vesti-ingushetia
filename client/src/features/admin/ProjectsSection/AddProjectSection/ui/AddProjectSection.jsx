import { useState, useEffect } from 'react';
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

const LOCAL_STORAGE_KEY_ADD_PROJECT = 'adminDashboard_addProjectSectionFormData';

export const AddProjectSection = ({ onSave, onCancel }) => {
    const dispatch = useDispatch();

    const [projectTitle, setProjectTitle] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ADD_PROJECT);
        return saved ? JSON.parse(saved).projectTitle || '' : '';
    });

    const [projectContent, setProjectContent] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ADD_PROJECT);
        return saved ? JSON.parse(saved).projectContent || '' : '';
    });

    const [projectMedia, setProjectMedia] = useState([[]]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    useEffect(() => {
        const formData = {
            projectTitle,
            projectContent,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY_ADD_PROJECT, JSON.stringify(formData));
    }, [projectTitle, projectContent]);

    useEffect(() => {
        validateField('media', projectMedia);
    }, [projectMedia]);

    const validateField = (fieldName, value) => {
        let error = '';
        switch (fieldName) {
            case 'title':
                if (!value.trim()) {
                    error = 'Поле заголовка обязательно для заполнения.';
                } else if (value.trim().length < 5) {
                    error = 'Заголовок должен быть не менее 5 символов.';
                }
                break;
            case 'content':
                if (!value.trim()) {
                    error = 'Поле содержания обязательно для заполнения.';
                } else if (value.trim().length < 20) {
                    error = 'Содержание должно быть не менее 20 символов.';
                }
                break;
            case 'media':
                if (!value || !value.some((group) => group.length > 0)) {
                    error = 'Добавьте хотя бы один файл.';
                }
                break;
            default:
                break;
        }

        setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: error }));
        return error === '';
    };

    const validateForm = () => {
        const isTitleValid = validateField('title', projectTitle);
        const isContentValid = validateField('content', projectContent);

        const isMediaValid = projectMedia.some((group) => group.length > 0);
        setErrors((prevErrors) => ({
            ...prevErrors,
            media: isMediaValid ? '' : 'Добавьте хотя бы один файл.',
        }));

        return (
            isTitleValid && isContentValid && isMediaValid
        );
    };

    const handleSave = () => {
        if (!validateForm()) return;

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
            localStorage.removeItem(LOCAL_STORAGE_KEY_ADD_PROJECT);
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

    const handleInputChange = (field, value) => {
        switch (field) {
            case 'title':
                setProjectTitle(value);
                break;
            case 'content':
                setProjectContent(value);
                break;
            default:
                break;
        }
        validateField(field, value);
    };

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

    const handleCancel = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY_ADD_PROJECT);
        onCancel();
    };

    useEffect(() => {
        return () => {
            projectMedia.flat().forEach((file) => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, [projectMedia]);

    return (
        <div className={styles.addProjectSection}>
            <h2>Добавить проект</h2>
            <div className={styles.addForm}>
                <label>Заголовок</label>
                <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                />
                {errors.title && <p className={styles.error}>{errors.title}</p>}

                <label>Содержание</label>
                <RichTextEditor
                    value={projectContent}
                    onChange={(value) => handleInputChange('content', value)}
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
                            accept="image/*,video/*"
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
                                            onLoad={() => {
                                                file.preview = URL.createObjectURL(file);
                                            }}
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
                    + Добавить ещё файлы
                </button>
                {errors.media && <p className={styles.error}>{errors.media}</p>}

                <div className={styles.buttons}>
                    <button className={styles.saveButton} onClick={handleSave}>
                        Сохранить
                    </button>
                    <button className={styles.cancelButton} onClick={handleCancel}>
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
};
