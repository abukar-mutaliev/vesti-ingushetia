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
    selectProjectList,
} from '@entities/projects/model/projectSelectors.js';

export const EditProjectSection = ({ project, onCancel }) => {
    const dispatch = useDispatch();
    const projects = useSelector(selectProjectList);
    const projectId = project?.id;

    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editMedia, setEditMedia] = useState([]);
    const [newMedia, setNewMedia] = useState([[]]);
    const [videoUrls, setVideoUrls] = useState(['']);
    const [errors, setErrors] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (projectId) {
            dispatch(fetchCategories());
            dispatch(fetchProjectById(projectId));
        }
    }, [dispatch, projectId]);

    const currentProject =
        useSelector(selectCurrentProject) ||
        projects.find((p) => p.id === projectId);

    useEffect(() => {
        if (currentProject) {
            setEditTitle(currentProject.title || '');
            setEditContent(currentProject.content || '');
            setEditMedia(currentProject.mediaFiles || []);
            setVideoUrls(
                currentProject.videoUrls && currentProject.videoUrls.length > 0
                    ? currentProject.videoUrls
                    : [''],
            );
        }
    }, [currentProject]);


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
            validateFields();
        }
    };

    const handleMediaChange = (e, index) => {
        const files = Array.from(e.target.files);
        setNewMedia((prevMedia) => {
            const updatedMedia = [...prevMedia];
            updatedMedia[index] = files;
            return updatedMedia;
        });
        if (hasAttemptedSubmit) {
            validateFields();
        }
    };

    const addNewMediaField = () => {
        setNewMedia([...newMedia, []]);
    };

    const removeNewMediaField = (index) => {
        setNewMedia((prevMedia) => prevMedia.filter((_, i) => i !== index));
        setErrors((prevErrors) => {
            const newMediaErrors = prevErrors.newMedia
                ? [...prevErrors.newMedia]
                : [];
            newMediaErrors.splice(index, 1);
            return { ...prevErrors, newMedia: newMediaErrors };
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
        if (hasAttemptedSubmit) {
            validateFields();
        }
    };

    const handleVideoUrlChange = (index, value) => {
        setVideoUrls((prevUrls) => {
            const updatedUrls = [...prevUrls];
            updatedUrls[index] = value;
            return updatedUrls;
        });

        if (hasAttemptedSubmit) {
            validateFields();
        }
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
                const hasExistingImages = editMedia.some((media) =>
                    media.type.startsWith('image'),
                );
                const hasNewImages = value.some((group) => group.length > 0);
                const hasVideoUrls = videoUrls.some((url) => url.trim() !== '');
                if (!hasExistingImages && !hasNewImages && !hasVideoUrls) {
                    error =
                        'Проект должен содержать хотя бы одно изображение или видео-ссылку.';
                }
                break;
            default:
                break;
        }
        return error;
    };

    const validateSingleVideoUrl = (url) => {
        const rutubeRegex =
            /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
        const youtubeRegex =
            /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;

        let error = '';
        if (url.trim()) {
            if (!rutubeRegex.test(url) && !youtubeRegex.test(url)) {
                error = 'Видео ссылка должна быть URL от Rutube или YouTube';
            }
        } else {
            error = 'Ссылка не может быть пустой';
        }

        return error;
    };

    const validateFields = () => {
        const newErrors = {};

        const titleError = validateField('title', editTitle);
        if (titleError) {
            newErrors.title = titleError;
        }

        const contentError = validateField('content', editContent);
        if (contentError) {
            newErrors.content = contentError;
        }

        const mediaError = validateField('media', newMedia);
        if (mediaError) {
            newErrors.media = mediaError;
        }

        const videoUrlErrors = videoUrls.map((url) => validateSingleVideoUrl(url));
        const hasVideoUrls = videoUrls.some((url) => url.trim() !== '');

        if (hasVideoUrls) {
            const anyVideoUrlErrors = videoUrlErrors.some((error) => error !== '');
            if (anyVideoUrlErrors) {
                newErrors.videoUrls = videoUrlErrors;
            }
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        setHasAttemptedSubmit(true);
        if (!validateFields()) {
            return;
        }

        const formData = new FormData();
        formData.append('title', editTitle);
        formData.append('content', editContent);

        formData.append(
            'existingMedia',
            JSON.stringify(editMedia.map((media) => media.id)),
        );

        newMedia.flat().forEach((file) => {
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
                setErrors((prev) => ({
                    ...prev,
                    submit: 'Произошла ошибка при обновлении проекта.',
                }));
                console.error('Ошибка при обновлении проекта:', error);
            }
        });
    };

    const embedVideo = (url, key) => {
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
                key={key}
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
            const updatedMedia = editMedia.filter((_, i) => i !== mediaToDelete);
            setEditMedia(updatedMedia);
            setMediaToDelete(null);
            setIsModalOpen(false);
            if (hasAttemptedSubmit) {
                validateFields();
            }
        }
    };

    useEffect(() => {
        if (hasAttemptedSubmit) {
            validateFields();
        }
    }, [editMedia, newMedia, videoUrls]);

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

                {/* Содержание */}
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

                {/* Видео-ссылки */}
                <div className={styles.previewVideosContainer}>
                    <label className={styles.label}>
                        Видео-ссылки (Rutube или YouTube)
                    </label>
                    <button
                        type="button"
                        className={styles.addButton}
                        onClick={addVideoUrlField}
                    >
                        <FaPlus /> Добавить ещё видео-ссылку
                    </button>
                    {videoUrls.map((url, index) => (
                        <div key={`video-url-${index}`} className={styles.videoUrlGroup}>
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

                    {videoUrls.map((url, index) =>
                        url.trim() && !errors.videoUrls?.[index]
                            ? embedVideo(url, `embedded-video-${index}-${url}`)
                            : null,
                    )}
                </div>

                {/* Добавление новых медиафайлов */}
                <label className={styles.label}>
                    Добавить новые медиафайлы
                </label>
                {newMedia.map((_, index) => (
                    <div key={`new-media-group-${index}`} className={styles.newMediaGroup}>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={(e) => handleMediaChange(e, index)}
                        />
                        {newMedia.length > 1 && (
                            <button
                                type="button"
                                className={styles.removeButton}
                                onClick={() => removeNewMediaField(index)}
                            >
                                <FaDeleteLeft />
                            </button>
                        )}
                    </div>
                ))}
                <button
                    type="button"
                    className={styles.addButton}
                    onClick={addNewMediaField}
                >
                    <FaPlus /> Добавить ещё медиафайл
                </button>

                {/* Просмотр существующих медиафайлов */}
                <label className={styles.label}>Медиафайлы</label>
                {editMedia.length > 0 && (
                    <div>
                        <p>Существующие медиафайлы:</p>
                        {editMedia.map((media, index) => (
                            <div key={`existing-media-${media.id || index}`} className={styles.mediaItem}>
                                {media.type.startsWith('image') ? (
                                    <img
                                        className={styles.media}
                                        src={`${media.url}`}
                                        alt="media"
                                    />
                                ) : (
                                    embedVideo(media.url, `existing-video-${media.id || index}`)
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

                {/* Просмотр добавленных медиафайлов */}
                {newMedia.flat().length > 0 && (
                    <div>
                        <p>Добавленные медиафайлы:</p>
                        <div className={styles.mediaPreview}>
                            {newMedia.flat().map((file, fileIndex) => (
                                <div
                                    key={`preview-${fileIndex}-${file.name}`}
                                    className={styles.previewItem}
                                >
                                    <button
                                        type="button"
                                        className={styles.removeButton}
                                        onClick={() =>
                                            setNewMedia((prev) =>
                                                prev.map((group, i) =>
                                                    i === fileIndex
                                                        ? group.filter(
                                                            (_, j) =>
                                                                j !==
                                                                fileIndex,
                                                        )
                                                        : group,
                                                ),
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

                {/* Ошибки */}
                {errors.media && <p className={styles.error}>{errors.media}</p>}
                {errors.videoUrls && (
                    <p className={styles.error}>Некорректные видео-ссылки.</p>
                )}
                {errors.submit && (
                    <p className={styles.error}>{errors.submit}</p>
                )}

                {/* Кнопки */}
                <div className={styles.buttons}>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={
                            hasAttemptedSubmit &&
                            Object.values(errors).some((error) => {
                                if (Array.isArray(error)) {
                                    return error.some((err) => err);
                                }
                                return error;
                            })
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
