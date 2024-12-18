import { useState, useEffect } from 'react';
import styles from './EditProjectSection.module.scss';
import { useDispatch } from 'react-redux';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import {
    updateProject,
    fetchAllProjects,
} from '@entities/projects/model/projectSlice.js';
import { FaDeleteLeft, FaPlus } from 'react-icons/fa6';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';

export const EditProjectSection = ({ project, onCancel }) => {
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editMedia, setEditMedia] = useState([]);
    const [newMedia, setNewMedia] = useState([]);
    const [videoUrls, setVideoUrls] = useState(['']);
    const [errors, setErrors] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState(null);
    const dispatch = useDispatch();

    useEffect(() => {
        if (project) {
            setEditTitle(project.title || '');
            setEditContent(project.content || '');
            setEditMedia(project.mediaFiles || []);
            setVideoUrls(project.videoUrls && project.videoUrls.length > 0 ? project.videoUrls : ['']);
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
        const hasVideoUrls = videoUrls.some(url => url.trim() !== '');
        if (totalMediaCount === 0 && !hasVideoUrls) {
            newErrors.media = 'Проект должен содержать хотя бы один медиафайл или видео-ссылку.';
        }

        if (videoUrls.length > 0 && hasVideoUrls) {
            const videoUrlsValid = validateVideoUrls();
            if (!videoUrlsValid) {
                newErrors.videoUrls = 'Некорректные видео-ссылки.';
            }
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

        const filteredVideoUrls = videoUrls.filter((url) => url.trim() !== '');
        filteredVideoUrls.forEach((url) => {
            formData.append('videoUrls', url);
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

    const embedVideo = (url) => {
        let embedUrl = '';
        if (url.includes('rutube.ru')) {
            const videoId = url.split('/video/')[1].split('/')[0];
            embedUrl = `https://rutube.ru/play/embed/${videoId}/`;
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const urlObj = new URL(url);
            let videoId = '';
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
            }
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
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

                <div className={styles.previewVideosContainer}>
                    <label className={styles.label}>Видео-ссылки (Rutube или YouTube)</label>
                    <button
                        type="button"
                        className={styles.addButton}
                        onClick={addVideoUrlField}
                    >
                        <FaPlus/> Добавить ещё видео-ссылку
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
                                    <FaDeleteLeft/>
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
                                    <FaDeleteLeft size={20}/>
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

                {errors.submit && <p className={styles.error}>{errors.submit}</p>}

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
