import { useState, useEffect } from 'react';
import styles from './EditNewsSection.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import { updateNews, fetchAllNews } from '@entities/news/model/newsSlice.js';
import { FaDeleteLeft } from 'react-icons/fa6';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';

export const EditNewsSection = ({ news, onCancel }) => {
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editMedia, setEditMedia] = useState([]);
    const [newMedia, setNewMedia] = useState([[]]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [errors, setErrors] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const categories = useSelector(selectCategories);
    const dispatch = useDispatch();

    useEffect(() => {
        if (news) {
            setEditTitle(news.title || '');
            setEditContent(news.content || '');
            setSelectedCategoryId(news.categoryId || '');
            setEditMedia(news.mediaFiles || []);
            const videoMedia = (news.mediaFiles || []).find((m) => m.type === 'video');
            setVideoUrl(videoMedia?.url || '');
            setPublishDate(news.publishDate ? formatDateForInput(news.publishDate) : '');
        }
        dispatch(fetchCategories());
    }, [news, dispatch]);

    const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        const pad = (num) => String(num).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const isSupportedVideoUrl = (url) => {
        if (!url) return true;

        const rutubeRegex = /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
        const youtubeRegex = /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;

        return rutubeRegex.test(url) || youtubeRegex.test(url);
    };

    const validateField = (fieldName, value) => {
        let error = '';
        switch (fieldName) {
            case 'title':
                if (!value.trim()) {
                    error = 'Поле заголовка обязательно для заполнения.';
                } else if (value.trim().length < 5) {
                    error = 'Заголовок должен содержать не менее 5 символов.';
                }
                break;
            case 'content':
                if (!value.trim()) {
                    error = 'Поле содержания обязательно для заполнения.';
                } else if (value.trim().length < 20) {
                    error = 'Содержание должно содержать не менее 20 символов.';
                }
                break;
            case 'category':
                if (!value) {
                    error = 'Выберите категорию.';
                }
                break;
            case 'media':
                const hasExistingImages = editMedia.some((media) => media.type === 'image');
                const hasNewImages = value.some(group => group.length > 0);

                if (!hasExistingImages && !hasNewImages) {
                    error = 'Необходимо добавить хотя бы одно изображение.';
                }
                break;
            case 'videoUrl':
                if (value && !isSupportedVideoUrl(value)) {
                    error = 'Видео ссылка должна быть URL от Rutube или YouTube';
                }
                break;
            case 'publishDate':
                if (value) {
                    const date = new Date(value);
                    if (isNaN(date)) {
                        error = 'Неверный формат даты.';
                    }
                }
                break;
            default:
                break;
        }
        setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: error }));
        return error === '';
    };

    const validateForm = () => {
        const isTitleValid = validateField('title', editTitle);
        const isContentValid = validateField('content', editContent);
        const isCategoryValid = validateField('category', selectedCategoryId);
        const isMediaValid = validateField('media', newMedia);
        const isVideoUrlValid = validateField('videoUrl', videoUrl);
        const isPublishDateValid = validateField('publishDate', publishDate);

        return (
            isTitleValid &&
            isContentValid &&
            isCategoryValid &&
            isMediaValid &&
            isVideoUrlValid &&
            isPublishDateValid
        );
    };

    const handleSave = () => {
        setHasAttemptedSubmit(true);

        if (!validateForm()) {
            return;
        }

        const formData = new FormData();
        formData.append('title', editTitle);
        formData.append('content', editContent);
        formData.append('categoryId', selectedCategoryId);

        if (videoUrl.trim() !== '') {
            formData.append('videoUrl', videoUrl.trim());
        }

        if (publishDate) {
            formData.append('publishDate', publishDate);
        }

        formData.append(
            'existingMedia',
            JSON.stringify(editMedia.map((media) => media.id)),
        );

        newMedia.flat().forEach((file) => {
            if (file.type.startsWith('image')) {
                formData.append('images', file);
            }
        });

        dispatch(updateNews({ id: news.id, newsData: formData }))
        .unwrap()
        .then(() => {
            dispatch(fetchAllNews());
            onCancel();
        })
        .catch((error) => {
            console.error('Ошибка при обновлении новости:', error);
        });
    };

    const handleInputChange = (field, value) => {
        switch (field) {
            case 'title':
                setEditTitle(value);
                break;
            case 'content':
                setEditContent(value);
                break;
            case 'category':
                setSelectedCategoryId(value);
                break;
            case 'videoUrl':
                setVideoUrl(value);
                break;
            case 'publishDate':
                setPublishDate(value);
                break;
            default:
                break;
        }
        if (hasAttemptedSubmit) {
            validateField(field, value);
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
            validateField('media', [...newMedia.slice(0, index), files, ...newMedia.slice(index + 1)]);
        }
    };

    const addNewMediaField = () => {
        setNewMedia([...newMedia, []]);
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
        <div className={styles.editNewsSection}>
            <h2>Редактировать новость</h2>
            <div className={styles.editForm}>
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

                <label>Категория</label>
                <select
                    value={selectedCategoryId}
                    onChange={(e) =>
                        handleInputChange('category', e.target.value)
                    }
                >
                    <option value="">Выберите категорию</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
                {errors.category && (
                    <p className={styles.error}>{errors.category}</p>
                )}

                <label>Ссылка на видео (YouTube или Rutube)</label>
                <input
                    type="text"
                    value={videoUrl}
                    placeholder="https://www.youtube.com/watch?v=..."
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                />
                {errors.videoUrl && <p className={styles.error}>{errors.videoUrl}</p>}

                <label>Дата публикации (опционально)</label>
                <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => handleInputChange('publishDate', e.target.value)}
                />
                {errors.publishDate && <p className={styles.error}>{errors.publishDate}</p>}

                <label>Изображения (обязательны)</label>
                {editMedia.length > 0 ? (
                    editMedia.map((media, index) => (
                        <div key={index} className={styles.mediaItem}>
                            {media.type === 'image' || media.type.startsWith('image') ? (
                                <img
                                    className={styles.media}
                                    src={`${media.url}`}
                                    alt="media"
                                />
                            ) : null}
                            <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteMedia(index)}
                            >
                                <FaDeleteLeft size={20} />
                            </button>
                        </div>
                    ))
                ) : (
                    <p>Нет загруженных изображений</p>
                )}

                <label>Новые изображения</label>
                {newMedia.map((_, index) => (
                    <input
                        key={index}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleMediaChange(e, index)}
                        className={styles.fileInput}
                    />
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
