import { useState, useEffect } from 'react';
import styles from './AddProjectSection.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import { createProject, fetchAllProjects } from '@entities/projects/model/projectSlice.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';
import { FaDeleteLeft, FaPlus } from 'react-icons/fa6';

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

    const [videoUrls, setVideoUrls] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ADD_PROJECT);
        return saved ? JSON.parse(saved).videoUrls || [''] : [''];
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
            videoUrls,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY_ADD_PROJECT, JSON.stringify(formData));
    }, [projectTitle, projectContent, videoUrls]);

    useEffect(() => {
        validateField('media', projectMedia);
    }, [projectMedia]);

    useEffect(() => {
        validateVideoUrls();
    }, [videoUrls]);

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
                    if (!videoUrls.some(url => url.trim() !== '')) {
                        error = 'Необходимо добавить хотя бы одно изображение или ссылку на видео.';
                    }
                }
                break;
            default:
                break;
        }

        setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: error }));
        return error === '';
    };

    const validateVideoUrls = () => {
        let videoUrlErrors = [];
        const rutubeRegex = /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
        const youtubeRegex = /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;

        videoUrls.forEach((url, index) => {
            if (url.trim()) {
                if (!rutubeRegex.test(url) && !youtubeRegex.test(url)) {
                    videoUrlErrors[index] = 'Видео ссылка должна быть URL от Rutube или YouTube';
                } else {
                    videoUrlErrors[index] = '';
                }
            }
        });

        setErrors((prevErrors) => ({ ...prevErrors, videoUrls: videoUrlErrors }));

        return videoUrlErrors.every((error) => error === '');
    };

    const validateForm = () => {
        const isTitleValid = validateField('title', projectTitle);
        const isContentValid = validateField('content', projectContent);
        const isMediaValid = validateField('media', projectMedia);

        const areVideoUrlsValid = validateVideoUrls();

        return (
            isTitleValid && isContentValid && isMediaValid && areVideoUrlsValid
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

        const filteredVideoUrls = videoUrls.filter((url) => url.trim() !== '');
        filteredVideoUrls.forEach((url) => {
            formData.append('videoUrls', url);
        });

        dispatch(createProject(formData))
        .unwrap()
        .then(() => {
            dispatch(fetchAllProjects());
            localStorage.removeItem(LOCAL_STORAGE_KEY_ADD_PROJECT);
            onSave();
        })
        .catch((error) => {
            console.error('Ошибка при создании проекта:', error);
            setErrors((prevErrors) => ({
                ...prevErrors,
                submit: 'Произошла ошибка при сохранении проекта. Пожалуйста, попробуйте ещё раз.',
            }));
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
            case 'videoUrl':
                handleVideoUrlChange(0, value);
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

    const addProjectMediaField = () => {
        setProjectMedia([...projectMedia, []]);
    };

    const removeMedia = (mediaIndex, fileIndex) => {
        setProjectMedia((prevMedia) => {
            const updatedMedia = prevMedia.map((group, idx) =>
                idx === mediaIndex ? group.filter((_, i) => i !== fileIndex) : group
            );
            return updatedMedia;
        });
    };


    const addVideoUrlField = () => {
        setVideoUrls([...videoUrls, '']);
    };

    const removeVideoUrlField = (index) => {
        setVideoUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
        setErrors((prevErrors) => {
            const newVideoUrlErrors = prevErrors.videoUrls
                ? [...prevErrors.videoUrls]
                : [];
            newVideoUrlErrors.splice(index, 1);
            return { ...prevErrors, videoUrls: newVideoUrlErrors };
        });
    };

    const handleVideoUrlChange = (index, value) => {
        setVideoUrls((prevUrls) => {
            const updatedUrls = [...prevUrls];
            updatedUrls[index] = value;
            return updatedUrls;
        });
    };

    const handleCancel = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY_ADD_PROJECT);
        onCancel();
    };

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

                <label>Видео-ссылки (Rutube или YouTube)</label>
                {videoUrls.map((url, index) => (
                    <div key={index} className={styles.videoUrlGroup}>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) =>
                                handleVideoUrlChange(index, e.target.value)
                            }
                            placeholder="Введите видео-ссылку"
                            className={styles.videoUrlInput}
                        />
                        {videoUrls.length > 1 && (
                            <button
                                type="button"
                                className={styles.removeButton}
                                onClick={() => removeVideoUrlField(index)}
                            >
                                <FaDeleteLeft />
                            </button>
                        )}
                        {errors.videoUrls && errors.videoUrls[index] && (
                            <p className={styles.error}>
                                {errors.videoUrls[index]}
                            </p>
                        )}
                    </div>
                ))}
                <button
                    type="button"
                    className={styles.addButton}
                    onClick={addVideoUrlField}
                >
                    <FaPlus /> Добавить ещё видео-ссылку
                </button>

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
                    onClick={addProjectMediaField}
                >
                    + Добавить ещё файлы
                </button>
                {errors.media && <p className={styles.error}>{errors.media}</p>}
                {errors.submit && <p className={styles.error}>{errors.submit}</p>}

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
