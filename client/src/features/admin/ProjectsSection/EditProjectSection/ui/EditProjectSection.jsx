import { useState, useEffect } from 'react';
import styles from './EditProjectSection.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import {
    updateProject,
    fetchProjectById,
} from '@entities/projects/model/projectSlice.js';
import { FaDeleteLeft, FaPlus } from 'react-icons/fa6';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';
import {
    selectCurrentProject,
    selectProjectList
} from '@entities/projects/model/projectSelectors.js';

export const EditProjectSection = ({ projectId, onCancel }) => {
    const dispatch = useDispatch();
    const projects = useSelector(selectProjectList);
    const project = useSelector(selectCurrentProject) || projects.find(p => p.id === projectId);

    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editMedia, setEditMedia] = useState([]);
    const [newMedia, setNewMedia] = useState([]);
    const [videoUrls, setVideoUrls] = useState(['']);
    const [errors, setErrors] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchProjectById(projectId));
    }, [dispatch, projectId]);

    useEffect(() => {
        if (project) {
            setEditTitle(project.title || '');
            setEditContent(project.content || '');
            setEditMedia(project.mediaFiles || []);
            setVideoUrls(project.videoUrls && project.videoUrls.length > 0 ? project.videoUrls : ['']);
        }
    }, [project]);

    const handleInputChange = (field, value) => {
        switch (field) {
            case 'title':
                setEditTitle(value);
                break;
            case 'content':
                setEditContent(value);
                break;
            default:
                break;
        }
        if (hasAttemptedSubmit) {
            validateField(field, value);
        }
    };

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        setNewMedia((prevMedia) => [...prevMedia, ...files]);
        if (hasAttemptedSubmit) {
            validateField('media', [...newMedia, ...files]);
        }
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

        validateSingleVideoUrl(index, value);
    };

    const validateSingleVideoUrl = (index, url) => {
        const rutubeRegex = /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
        const youtubeRegex = /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;

        let error = '';
        if (url.trim()) {
            if (!rutubeRegex.test(url) && !youtubeRegex.test(url)) {
                error = 'Видео ссылка должна быть URL от Rutube или YouTube';
            }
        } else {
            error = 'Ссылка не может быть пустой';
        }

        setErrors((prevErrors) => {
            const videoUrlErrors = prevErrors.videoUrls
                ? [...prevErrors.videoUrls]
                : [];
            videoUrlErrors[index] = error;
            return { ...prevErrors, videoUrls: videoUrlErrors };
        });

        return error === '';
    };

    const validateVideoUrls = () => {
        let isValid = true;
        videoUrls.forEach((url, index) => {
            const valid = validateSingleVideoUrl(index, url);
            if (!valid) isValid = false;
        });
        return isValid;
    };

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
                const hasExistingImages = editMedia.some(media => media.type.startsWith('image'));
                const hasNewImages = newMedia.some(file => file.type.startsWith('image'));
                const hasVideoUrls = videoUrls.some(url => url.trim() !== '');
                if (!hasExistingImages && !hasNewImages && !hasVideoUrls) {
                    error = 'Проект должен содержать хотя бы одно изображение или видео-ссылку.';
                }
                break;
            default:
                break;
        }
        setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: error }));
        return error === '';
    };

    const validateFieldsFinal = () => {
        setHasAttemptedSubmit(true);
        const newErrors = {};

        const isTitleValid = validateField('title', editTitle);
        const isContentValid = validateField('content', editContent);
        const isMediaValid = validateField('media', newMedia);

        const hasVideoUrls = videoUrls.some(url => url.trim() !== '');
        if (hasVideoUrls) {
            const videoUrlsValid = validateVideoUrls();
            if (!videoUrlsValid) {
                newErrors.videoUrls = 'Некорректные видео-ссылки.';
            }
        }

        setErrors(newErrors);
        return (
            isTitleValid &&
            isContentValid &&
            isMediaValid &&
            (!hasVideoUrls || (hasVideoUrls && validateVideoUrls()))
        );
    };

    const handleSave = () => {
        if (!validateFieldsFinal()) return;

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

        const filteredVideoUrls = videoUrls.filter((url) => url.trim() !== '');
        filteredVideoUrls.forEach((url) => {
            formData.append('videoUrls', url);
        });

        dispatch(updateProject({ id: project.id, projectData: formData }))
        .unwrap()
        .then(() => {
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
                setErrors(prev => ({ ...prev, submit: 'Произошла ошибка при обновлении проекта.' }));
                console.error('Ошибка при обновлении проекта:', error);
            }
        });
    };

    const embedVideo = (url) => {
        let embedUrl = '';
        if (url.includes('rutube.ru')) {
            const videoIdMatch = url.match(/rutube\.ru\/video\/([A-Za-z0-9_-]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            if (videoId) {
                embedUrl = `https://rutube.ru/play/embed/${videoId}/`;
            }
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            try {
                const urlObj = new URL(url);
                let videoId = '';
                if (urlObj.hostname.includes('youtube.com')) {
                    videoId = urlObj.searchParams.get('v');
                } else if (urlObj.hostname.includes('youtu.be')) {
                    videoId = urlObj.pathname.slice(1);
                }
                if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }
            } catch (e) {
                console.error('Некорректный URL:', url);
            }
        }

        return embedUrl ? (
            <iframe
                width="400"
                height="215"
                src={embedUrl}
                title="Видео-плеер"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.videoIframe}
            ></iframe>
        ) : null;
    };

    const handleDeleteMedia = (index) => {
        setMediaToDelete(index);
        setIsModalOpen(true);
    };

    const confirmDeleteMedia = () => {
        if (mediaToDelete !== null) {
            setEditMedia((prevMedia) =>
                prevMedia.filter((_, i) => i !== mediaToDelete),
            );
            setMediaToDelete(null);
            setIsModalOpen(false);

            if (hasAttemptedSubmit) {
                validateField('media', newMedia);
            }
        }
    };

    return (
        <div className={styles.editProjectSection}>
            <h2>Редактировать проект</h2>
            <div className={styles.editForm}>
                {/* Заголовок */}
                <label>Заголовок</label>
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                />
                {errors.title && <p className={styles.error}>{errors.title}</p>}

                <label>Содержание</label>
                <div className={styles.richTextEditor}>
                    <RichTextEditor
                        value={editContent}
                        onChange={(value) =>
                            handleInputChange('content', value)
                        }
                    />
                    {errors.content && (
                        <p className={styles.error}>{errors.content}</p>
                    )}
                </div>

                <div className={styles.previewVideosContainer}>
                    <label className={styles.label}>Видео-ссылки (Rutube или YouTube)</label>
                    <button
                        type="button"
                        className={styles.addButton}
                        onClick={addVideoUrlField}
                    >
                        <FaPlus /> Добавить ещё видео-ссылку
                    </button>
                    {videoUrls.map((url, index) => (
                        <div key={index} className={styles.videoUrlGroup}>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) =>
                                    handleVideoUrlChange(index, e.target.value)
                                }
                                placeholder="Введите Rutube или YouTube ссылку"
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

                    {videoUrls.map((url, index) => (
                        url.trim() && !errors.videoUrls?.[index] && embedVideo(url)
                    ))}
                </div>

                <label className={styles.label}>Добавить новые медиафайлы</label>
                <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                />

                <label className={styles.label}>Медиафайлы</label>
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
                                    embedVideo(media.url)
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

                {newMedia.length > 0 && (
                    <div>
                        <p>Добавленные медиафайлы:</p>
                        <div className={styles.mediaPreview}>
                            {newMedia.map((file, fileIndex) => (
                                <div
                                    key={fileIndex}
                                    className={styles.previewItem}
                                >
                                    <button
                                        type="button"
                                        className={styles.removeButton}
                                        onClick={() =>
                                            setNewMedia((prev) =>
                                                prev.filter((_, i) => i !== fileIndex)
                                            )
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
                )}

                {errors.media && <p className={styles.error}>{errors.media}</p>}
                {errors.videoUrls && <p className={styles.error}>{errors.videoUrls}</p>}
                {errors.submit && <p className={styles.error}>{errors.submit}</p>}

                <div className={styles.buttons}>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={
                            hasAttemptedSubmit &&
                            Object.values(errors).some((error) => error)
                        }
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
                onClose={() => {
                    setIsModalOpen(false);
                    setMediaToDelete(null);
                }}
                onConfirm={confirmDeleteMedia}
            />
        </div>
    );
};
