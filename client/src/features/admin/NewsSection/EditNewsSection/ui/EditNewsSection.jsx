import { useState, useEffect } from 'react';
import styles from './EditNewsSection.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import { updateNews, fetchAllNews } from '@entities/news/model/newsSlice.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';
import { FaDeleteLeft } from 'react-icons/fa6';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal';

export const EditNewsSection = ({ news, onCancel }) => {
    const dispatch = useDispatch();
    const categories = useSelector(selectCategories);

    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [editMedia, setEditMedia] = useState([]);
    const [newMedia, setNewMedia] = useState([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [errors, setErrors] = useState({});
    const [mediaToDelete, setMediaToDelete] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    // Обновленное регулярное выражение
    const videoUrlRegex = /^(https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|rutube\.ru\/video\/)[\w\d-]+(?:\/)?(?:\?.*)?)$/i;

    useEffect(() => {
        if (news) {
            setEditTitle(news.title || '');
            setEditContent(news.content || '');
            setSelectedCategoryIds(news.categories.map((category) => category.id));
            setEditMedia(news.mediaFiles || []);
            const videoMedia = news.mediaFiles?.find((m) => m.type === 'video');
            setVideoUrl(videoMedia?.url || '');
            setPublishDate(
                news.publishDate
                    ? new Date(news.publishDate).toISOString().slice(0, 16)
                    : '',
            );
        }
        dispatch(fetchCategories());
    }, [news, dispatch]);

    useEffect(() => {
        const hasExistingMedia = editMedia.length > 0;
        const hasNewMedia = newMedia.length > 0;
        const hasVideoUrl = videoUrl.trim() !== '';
        const isVideoUrlValid = videoUrl ? videoUrlRegex.test(videoUrl) : false;

        const isMediaValid = hasExistingMedia || hasNewMedia || (hasVideoUrl && isVideoUrlValid);

        if (!isMediaValid) {
            setErrors(prevErrors => ({
                ...prevErrors,
                media: 'Необходимо добавить хотя бы одно изображение или ссылку на видео.'
            }));
        } else {
            setErrors(prevErrors => ({
                ...prevErrors,
                media: undefined
            }));
        }
    }, [editMedia, newMedia, videoUrl, videoUrlRegex]);

    const validateField = (fieldName, value) => {
        let error = '';
        switch (fieldName) {
            case 'title':
                if (!value.trim()) error = 'Поле заголовка обязательно для заполнения.';
                else if (value.trim().length < 5) error = 'Заголовок должен содержать не менее 5 символов.';
                break;
            case 'content':
                if (!value.trim()) error = 'Поле содержания обязательно для заполнения.';
                else if (value.trim().length < 20) error = 'Содержание должно содержать не менее 20 символов.';
                break;
            case 'categories':
                if (value.length === 0) error = 'Выберите хотя бы одну категорию.';
                break;
            case 'videoUrl':
                if (value && !videoUrlRegex.test(value)) {
                    error = 'Видео ссылка должна быть URL от Rutube или YouTube.';
                }
                break;

            default:
                break;
        }
        setErrors((prevErrors) => ({
            ...prevErrors,
            [fieldName]: error || undefined,
        }));
        return !error;
    };

    const validateForm = () => {
        const isTitleValid = validateField('title', editTitle);
        const isContentValid = validateField('content', editContent);
        const isCategoriesValid = validateField('categories', selectedCategoryIds);
        const isVideoUrlValid = validateField('videoUrl', videoUrl);

        const hasExistingMedia = editMedia.length > 0;
        const hasNewMedia = newMedia.length > 0;
        const hasVideoUrl = videoUrl.trim() !== '';

        // Обновлено: учитываем валидность videoUrl
        const isMediaValid = hasExistingMedia || hasNewMedia || (hasVideoUrl && isVideoUrlValid);

        if (!isMediaValid) {
            setErrors(prevErrors => ({
                ...prevErrors,
                media: 'Необходимо добавить хотя бы одно изображение или ссылку на видео.'
            }));
        } else {
            setErrors(prevErrors => ({
                ...prevErrors,
                media: undefined
            }));
        }

        return (
            isTitleValid &&
            isContentValid &&
            isCategoriesValid &&
            isVideoUrlValid &&
            isMediaValid
        );
    };

    const handleInputChange = (field, value) => {
        switch (field) {
            case 'title':
                setEditTitle(value);
                break;
            case 'content':
                setEditContent(value);
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
        validateField(field, value);
    };

    const handleSave = () => {
        setHasAttemptedSubmit(true);
        setErrors({});

        if (!validateForm()) {
            console.log('Форма не прошла валидацию:', errors);
            return;
        }

        const formData = new FormData();
        formData.append('title', editTitle);
        formData.append('content', editContent);
        formData.append('categoryIds', JSON.stringify(selectedCategoryIds));

        if (videoUrl.trim()) formData.append('videoUrl', videoUrl.trim());
        if (publishDate) formData.append('publishDate', publishDate);

        formData.append(
            'existingMedia',
            JSON.stringify(editMedia.map((media) => media.id)),
        );

        newMedia.forEach((file) => {
            if (file && file.type.startsWith('image')) formData.append('images', file);
        });


        dispatch(updateNews({ id: news.id, newsData: formData }))
            .unwrap()
            .then(() => {
                dispatch(fetchAllNews());
                setHasAttemptedSubmit(false);
                onCancel();
            })
            .catch((error) => {
                console.error('Ошибка при обновлении новости:', error);

                if (error.errors) {
                    const newErrors = {};
                    error.errors.forEach((err) => {
                        newErrors[err.path] = err.msg; // Запись ошибки по полю
                    });
                    setErrors((prev) => ({
                        ...prev,
                        ...newErrors,
                        submit: 'Пожалуйста, исправьте ошибки в форме.',
                    }));
                } else {
                    setErrors((prev) => ({
                        ...prev,
                        submit: error.message || 'Произошла ошибка при сохранении новости.',
                    }));
                }
            });
    };

    const handleCategoryChange = (e) => {
        const { value, checked } = e.target;
        setSelectedCategoryIds((prev) =>
            checked ? [...prev, parseInt(value)] : prev.filter((id) => id !== parseInt(value)),
        );
    };

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        setNewMedia((prevMedia) => [...prevMedia, ...files]);
    };

    const addNewMediaField = () => {
        setNewMedia([...newMedia, null]); // Исправлено: добавляем null вместо []
    };

    const handleDeleteMedia = (index) => {
        setMediaToDelete(index);
        setIsModalOpen(true);
    };

    const confirmDeleteMedia = () => {
        setEditMedia((prevMedia) => prevMedia.filter((_, i) => i !== mediaToDelete));
        setMediaToDelete(null);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setHasAttemptedSubmit(false);
        onCancel();
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

                <label>Категории</label>
                <div className={styles.checkboxGroup}>
                    {categories.map((category) => (

                        <label key={category.id} className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                value={category.id}
                                checked={selectedCategoryIds.includes(category.id)}
                                onChange={handleCategoryChange}
                                className={styles.checkboxInput}
                            />
                            <span className={styles.checkboxCustom}></span>
                            {category.name}
                        </label>
                    ))}
                </div>
                {errors.categories && (
                    <p className={styles.error}>{errors.categories}</p>
                )}

                <label>Ссылка на видео (YouTube или Rutube)</label>
                <input
                    type="text"
                    value={videoUrl}
                    placeholder="https://www.youtube.com/watch?v=..."
                    onChange={(e) =>
                        handleInputChange('videoUrl', e.target.value)
                    }
                />
                {errors.videoUrl && <p className={styles.error}>{errors.videoUrl}</p>}

                <label>Дата публикации (опционально)</label>
                <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) =>
                        handleInputChange('publishDate', e.target.value)
                    }
                />

                <label>Изображения</label>
                {editMedia.length > 0 ? (
                    editMedia.map((media, index) => (
                        <div key={index} className={styles.mediaItem}>
                            {media.type === 'image' ||
                            media.type.startsWith('image') ? (
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
                                <FaDeleteLeft size={20}/>
                            </button>
                        </div>
                    ))
                ) : (
                    <p>Нет загруженных изображений</p>
                )}

                <label>Новые изображения</label>
                {newMedia.map((file, index) => (
                    <input
                        key={index}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleMediaChange}
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
                {errors.submit && <p className={styles.error}>{errors.submit}</p>}

                <div className={styles.buttons}>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={
                            hasAttemptedSubmit && Object.values(errors).some((error) => error)
                        }
                    >
                        Сохранить
                    </button>
                    <button className={styles.cancelButton} onClick={handleCancel}>
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
