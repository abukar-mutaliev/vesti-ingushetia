import { useState, useEffect } from 'react';
import styles from './EditNewsSection.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import { updateNews, fetchAllNews } from '@entities/news/model/newsSlice.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';
import { FaDeleteLeft } from 'react-icons/fa6';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal';
import { MoscowTimeUtils } from '@shared/lib/TimeUtils/timeUtils.js';

export const EditNewsSection = ({ news, onCancel, embedded = false }) => {
    const dispatch = useDispatch();
    const categories = useSelector(selectCategories);

    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [editMedia, setEditMedia] = useState([]);
    const [newMedia, setNewMedia] = useState([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoPreview, setVideoPreview] = useState(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [isElections, setIsElections] = useState(false);
    const [errors, setErrors] = useState({});
    const [mediaToDelete, setMediaToDelete] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    const videoUrlRegex =
        /^(https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|rutube\.ru\/video\/)[\w\d-]+(?:\/)?(?:\?.*)?|https?:\/\/(?:(?:www\.|m\.)?vk\.(?:com|ru)\/(?:(?:video\?z=video|video\?id=|video|clip)(-?\d+)_(\d+)|[^?#]+[?&]z=video(-?\d+)_(\d+))|(?:www\.)?vkvideo\.ru\/(?:video|clip)(-?\d+)_(\d+))(?:\?.*)?)$/i;

    useEffect(() => {
        if (news) {
            setEditTitle(news.title || '');
            setEditContent(news.content || '');
            setIsElections(Boolean(news.isElections));
            const rawCategoryIds = Array.isArray(news.categories)
                ? news.categories.map((category) => category.id)
                : [news.categoryId ?? news.category?.id];
            setSelectedCategoryIds(
                rawCategoryIds
                    .map((id) => Number(id))
                    .filter((id) => Number.isInteger(id) && id > 0),
            );
            setEditMedia(news.mediaFiles || []);
            const videoMedia = news.mediaFiles?.find((m) => m.type === 'video');
            setVideoUrl(videoMedia?.url || '');

            // ИСПРАВЛЕНО: правильно отображаем время для редактирования
            if (news.publishDate) {
                console.log('🕐 [CLIENT] Загрузка времени для редактирования:');
                console.log(`   Время с сервера: ${news.publishDate}`);

                const localTimeForInput = MoscowTimeUtils.fromServerTime(news.publishDate);
                setPublishDate(localTimeForInput);

                console.log(`   Время для input: ${localTimeForInput}`);
                console.log(`   Московское время: ${MoscowTimeUtils.formatMoscowTime(news.publishDate)}`);
            } else {
                setPublishDate('');
            }
        }
        dispatch(fetchCategories());
    }, [news, dispatch]);

    useEffect(() => {
        const hasExistingMedia = editMedia.length > 0;
        const hasNewMedia = newMedia.length > 0;
        const hasVideoUrl = videoUrl.trim() !== '';

        const isMediaValid = hasExistingMedia || hasNewMedia || hasVideoUrl;

        if (!isMediaValid) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                media: 'Необходимо добавить хотя бы одно изображение или ссылку на видео.',
            }));
        } else {
            setErrors((prevErrors) => ({
                ...prevErrors,
                media: undefined,
            }));
        }
    }, [editMedia, newMedia, videoUrl]);

    const validateField = (fieldName, value) => {
        let error = '';
        switch (fieldName) {
            case 'title':
                if (!value.trim())
                    error = 'Поле заголовка обязательно для заполнения.';
                else if (value.trim().length < 5)
                    error = 'Заголовок должен содержать не менее 5 символов.';
                break;
            case 'content':
                if (!value.trim())
                    error = 'Поле содержания обязательно для заполнения.';
                else if (value.trim().length < 20)
                    error = 'Содержание должно содержать не менее 20 символов.';
                break;
            case 'categories':
                if (value.length === 0)
                    error = 'Выберите хотя бы одну категорию.';
                break;
            case 'videoUrl':
                if (value && !videoUrlRegex.test(value)) {
                    error =
                        'Видео ссылка должна быть URL от Rutube, YouTube или ВКонтакте.';
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
        const isCategoriesValid = validateField(
            'categories',
            selectedCategoryIds,
        );
        const isVideoUrlValid = validateField('videoUrl', videoUrl);

        const hasExistingMedia = editMedia.length > 0;
        const hasNewMedia = newMedia.length > 0;
        const hasVideoUrl = videoUrl.trim() !== '';

        const isMediaValid = hasExistingMedia || hasNewMedia || hasVideoUrl;

        if (!isMediaValid) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                media: 'Необходимо добавить хотя бы одно изображение или ссылку на видео.',
            }));
        } else {
            setErrors((prevErrors) => ({
                ...prevErrors,
                media: undefined,
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

    const clearVideoPreview = () => {
        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl);
        }
        setVideoPreview(null);
        setVideoPreviewUrl('');
        setErrors((prev) => ({ ...prev, videoPreview: undefined }));
    };

    const handleVideoPreviewChange = (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setErrors((prev) => ({
                ...prev,
                videoPreview: 'Превью должно быть в формате JPG или PNG.',
            }));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors((prev) => ({
                ...prev,
                videoPreview: 'Превью не должно быть больше 5MB.',
            }));
            return;
        }

        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl);
        }
        setVideoPreview(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
        setErrors((prev) => ({ ...prev, videoPreview: undefined }));
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
                if (!value.trim()) {
                    clearVideoPreview();
                }
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
        const validCategoryIds = selectedCategoryIds
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0);
        formData.append('categoryIds', JSON.stringify(validCategoryIds));
        if (validCategoryIds[0]) {
            formData.append('categoryId', String(validCategoryIds[0]));
        }
        formData.append('isElections', isElections ? 'true' : 'false');

        if (videoUrl.trim()) formData.append('videoUrl', videoUrl.trim());
        if (videoPreview) formData.append('videoPreview', videoPreview);

        // ИСПРАВЛЕНО: правильно обрабатываем время публикации
        if (publishDate) {
            console.log('🕐 [CLIENT] Сохранение времени публикации:');
            console.log(`   Введенное время: ${publishDate}`);

            const serverTime = MoscowTimeUtils.toServerTime(publishDate);
            formData.append('publishDate', serverTime);

            console.log(`   Отправляется на сервер: ${serverTime}`);
        }

        formData.append('existingMedia', JSON.stringify(editMedia.map((media) => media.id)));

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
                        const field =
                            err.path === 'categoryId' || err.path === 'categoryIds'
                                ? 'categories'
                                : err.path;
                        newErrors[field] = err.msg;
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
            checked
                ? [...prev, parseInt(value)]
                : prev.filter((id) => id !== parseInt(value)),
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
        setEditMedia((prevMedia) =>
            prevMedia.filter((_, i) => i !== mediaToDelete),
        );
        setMediaToDelete(null);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setHasAttemptedSubmit(false);
        onCancel();
    };


    return (
        <div className={`${styles.editNewsSection} ${embedded ? styles.embedded : ''}`}>
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
                        <label
                            key={category.id}
                            className={styles.checkboxLabel}
                        >
                            <input
                                type="checkbox"
                                value={category.id}
                                checked={selectedCategoryIds.some(
                                    (id) => Number(id) === Number(category.id),
                                )}
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

                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={isElections}
                        onChange={(e) => setIsElections(e.target.checked)}
                        className={styles.checkboxInput}
                    />
                    <span className={styles.checkboxCustom}></span>
                    Выборы
                </label>

                <label>Ссылка на видео (YouTube, Rutube или ВКонтакте)</label>
                <input
                    type="text"
                    value={videoUrl}
                    placeholder="YouTube, Rutube или VK ссылка..."
                    onChange={(e) =>
                        handleInputChange('videoUrl', e.target.value)
                    }
                />
                {errors.videoUrl && (
                    <p className={styles.error}>{errors.videoUrl}</p>
                )}

                {videoUrl.trim() && (
                    <div>
                        <label>Превью видео</label>
                        {editMedia
                            .filter((media) => media.type === 'preview')
                            .map((media) => (
                                <div key={media.id} className={styles.mediaItem}>
                                    <img
                                        className={styles.media}
                                        src={media.url}
                                        alt="Текущее превью"
                                    />
                                    <button
                                        type="button"
                                        className={styles.deleteButton}
                                        onClick={() =>
                                            handleDeleteMedia(
                                                editMedia.findIndex(
                                                    (item) => item.id === media.id,
                                                ),
                                            )
                                        }
                                    >
                                        <FaDeleteLeft size={20} />
                                    </button>
                                </div>
                            ))}
                        <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleVideoPreviewChange}
                            className={styles.fileInput}
                        />
                        {videoPreviewUrl && (
                            <img
                                src={videoPreviewUrl}
                                alt="Новое превью"
                                className={styles.media}
                            />
                        )}
                        <p className={styles.mediaPreview}>
                            Необязательно. Это изображение появится в карточке, если кадр из видео не загрузится.
                        </p>
                        {errors.videoPreview && (
                            <p className={styles.error}>{errors.videoPreview}</p>
                        )}
                    </div>
                )}

                <label>Дата публикации (московское время, опционально)</label>
                <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) =>
                        handleInputChange('publishDate', e.target.value)
                    }
                />
                {publishDate && (
                    <p className={styles.timePreview}>
                        📅 Выбрано: {MoscowTimeUtils.formatFull(publishDate)}
                    </p>
                )}

                <label>Изображения</label>
                {editMedia.some((media) => media.type === 'image' || media.type?.startsWith('image')) ? (
                    editMedia.map((media, index) => (
                        media.type === 'preview' ? null : (
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
                                <FaDeleteLeft size={20} />
                            </button>
                        </div>
                        )
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
                {errors.submit && (
                    <p className={styles.error}>{errors.submit}</p>
                )}

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
                    <button
                        className={styles.cancelButton}
                        onClick={handleCancel}
                    >
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
