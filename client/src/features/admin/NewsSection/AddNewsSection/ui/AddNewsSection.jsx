import { useState, useEffect } from 'react';
import styles from './AddNewsSection.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import { createNews, fetchAllNews } from '@entities/news/model/newsSlice.js';
import { createScheduledNews, cancelScheduledNews } from '@entities/news/model/scheduledNewsSlice.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';
import { FaDeleteLeft, FaClock } from 'react-icons/fa6';
import { FaCalendarAlt, FaCrop } from 'react-icons/fa';
import { MoscowTimeUtils } from '@shared/lib/TimeUtils/timeUtils.js';
import { ImageCropModal } from './ImageCropModal.jsx';

const LOCAL_STORAGE_KEY = 'adminDashboard_addNewsSectionFormData';

export const AddNewsSection = ({ onSave, onCancel }) => {
    const dispatch = useDispatch();
    const categories = useSelector(selectCategories);

    const [newsTitle, setNewsTitle] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).newsTitle || '' : '';
    });

    const [newsContent, setNewsContent] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).newsContent || '' : '';
    });

    const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).selectedCategoryIds || [] : [];
    });

    const [videoUrl, setVideoUrl] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).videoUrl || '' : '';
    });

    const [publishDate, setPublishDate] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).publishDate || '' : '';
    });

    const [isDeferred, setIsDeferred] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).isDeferred || false : false;
    });

    const [deferredDate, setDeferredDate] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).deferredDate || '' : '';
    });

    // Существующие изображения (URL) при редактировании отложенных новостей
    const [existingMediaUrls, setExistingMediaUrls] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).existingMediaUrls || [] : [];
    });

    // ID запланированной новости для отмены при сохранении (при редактировании)
    const [scheduledNewsIdToCancel, setScheduledNewsIdToCancel] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).scheduledNewsIdToCancel || null : null;
    });

    const [newsMedia, setNewsMedia] = useState([[]]);
    const [errors, setErrors] = useState({});

    // State for image cropping modal
    const [cropModal, setCropModal] = useState({
        isOpen: false,
        image: null,
        groupIndex: null,
        fileIndex: null,
    });

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    // Загружаем данные из localStorage при монтировании (для редактирования отложенных новостей)
    useEffect(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            try {
                const parsedData = JSON.parse(saved);
                // Обновляем существующие изображения если они есть
                if (parsedData.existingMediaUrls && parsedData.existingMediaUrls.length > 0) {
                    setExistingMediaUrls(parsedData.existingMediaUrls);
                }
                // Обновляем ID для отмены если есть
                if (parsedData.scheduledNewsIdToCancel) {
                    setScheduledNewsIdToCancel(parsedData.scheduledNewsIdToCancel);
                }
            } catch (e) {
                console.error('Ошибка парсинга данных из localStorage:', e);
            }
        }
    }, []);

    useEffect(() => {
        const formData = {
            newsTitle,
            newsContent,
            selectedCategoryIds,
            videoUrl,
            publishDate,
            isDeferred,
            deferredDate,
            existingMediaUrls,
            scheduledNewsIdToCancel,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
    }, [
        newsTitle,
        newsContent,
        selectedCategoryIds,
        videoUrl,
        publishDate,
        isDeferred,
        deferredDate,
        existingMediaUrls,
        scheduledNewsIdToCancel,
    ]);

    useEffect(() => {
        validateField('media', newsMedia);
    }, [newsMedia]);

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
            case 'categories':
                if (!value || value.length === 0) {
                    error = 'Выберите хотя бы одну категорию.';
                }
                break;
            case 'videoUrl':
                const rutubeRegex =
                    /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
                const youtubeRegex =
                    /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;
                const vkRegex =
                    /^https?:\/\/(?:www\.|m\.)?vk\.(?:com|ru)\/(?:(?:video\?z=video|video\?id=|video|clip)(-?\d+)_(\d+)|[^?#]+[?&]z=video(-?\d+)_(\d+))(?:\?.*)?$/i;
                if (
                    value &&
                    !(rutubeRegex.test(value) || youtubeRegex.test(value) || vkRegex.test(value))
                ) {
                    error =
                        'Видео ссылка должна быть URL от Rutube, YouTube или ВКонтакте';
                }
                break;
            case 'media':
                if (!value || !value.some((group) => group.length > 0)) {
                    if (!videoUrl.trim()) {
                        error =
                            'Необходимо добавить хотя бы одно изображение или ссылку на видео.';
                    }
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
            case 'deferredDate':
                if (isDeferred && !value) {
                    error = 'Укажите дату и время отложенной публикации.';
                } else if (value) {
                    const validation =
                        MoscowTimeUtils.validateScheduleDate(value);
                    if (!validation.valid) {
                        error = validation.error;
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
        const isTitleValid = validateField('title', newsTitle);
        const isContentValid = validateField('content', newsContent);
        const isCategoriesValid = validateField(
            'categories',
            selectedCategoryIds,
        );
        const isVideoUrlValid = validateField('videoUrl', videoUrl);
        const isPublishDateValid = validateField('publishDate', publishDate);
        const isDeferredDateValid = validateField('deferredDate', deferredDate);

        const isMediaValid =
            videoUrl.trim() || newsMedia.some((group) => group.length > 0) || existingMediaUrls.length > 0;
        setErrors((prevErrors) => ({
            ...prevErrors,
            media: isMediaValid
                ? ''
                : 'Необходимо добавить хотя бы одно изображение или ссылку на видео.',
        }));

        return (
            isTitleValid &&
            isContentValid &&
            isCategoriesValid &&
            isVideoUrlValid &&
            isPublishDateValid &&
            isDeferredDateValid &&
            isMediaValid
        );
    };

    const saveToDrafts = () => {
        const draftData = {
            id: Date.now(),
            newsTitle,
            newsContent,
            selectedCategoryIds,
            videoUrl,
            publishDate,
            isDeferred,
            deferredDate,
            newsMedia: newsMedia.flat().map((file) => ({
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
            })),
            createdAt: new Date().toISOString(),
            status: isDeferred ? 'scheduled' : 'draft',
        };

        const existingDrafts = JSON.parse(
            localStorage.getItem('newsDrafts') || '[]',
        );
        existingDrafts.push(draftData);
        localStorage.setItem('newsDrafts', JSON.stringify(existingDrafts));

        setErrors((prev) => ({
            ...prev,
            submit: `Новость сохранена в ${isDeferred ? 'отложенные' : 'черновики'}.`,
        }));

        setTimeout(() => {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            onSave();
        }, 1500);
    };



    const handleSave = () => {
        if (!validateForm()) return;

        const formData = new FormData();
        formData.append('title', newsTitle);
        formData.append('content', newsContent);

        const validCategoryIds =
            selectedCategoryIds.length > 0
                ? selectedCategoryIds
                    .map((id) => Number(id))
                    .filter((id) => Number.isInteger(id) && id > 0)
                : categories.map((cat) => cat.id).slice(0, 1);

        if (validCategoryIds.length === 0) {
            setErrors((prev) => ({
                ...prev,
                categories: 'Необходимо создать хотя бы одну категорию',
            }));
            return;
        }

        formData.append('categoryIds', JSON.stringify(validCategoryIds));

        if (videoUrl.trim()) {
            formData.append('videoUrl', videoUrl.trim());
        }

        // Обработка времени публикации
        if (isDeferred && deferredDate) {
            formData.append('scheduleForLater', 'true');

            const serverTime = MoscowTimeUtils.toServerTime(deferredDate);
            if (serverTime) {
                formData.append('publishDate', serverTime);

                console.log('📅 [CLIENT] Планирование новости:');
                console.log(`   Выбранное время: ${deferredDate}`);
                console.log(`   Московское время: ${MoscowTimeUtils.formatMoscowTime(serverTime)}`);
                console.log(`   Отправляется на сервер: ${serverTime}`);
            } else {
                setErrors((prev) => ({
                    ...prev,
                    deferredDate: 'Ошибка обработки времени публикации'
                }));
                return;
            }
        } else if (publishDate && !isDeferred) {
            const serverTime = MoscowTimeUtils.toServerTime(publishDate);
            if (serverTime) {
                formData.append('publishDate', serverTime);
            }
        }

        // Передаём существующие URL изображений (при редактировании отложенной новости)
        if (existingMediaUrls.length > 0) {
            formData.append('existingMediaUrls', JSON.stringify(existingMediaUrls));
            console.log('📷 [CLIENT] Существующие изображения:', existingMediaUrls);
        }

        // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ФАЙЛОВ
        console.log('📁 [CLIENT] Анализ файлов перед отправкой:');
        console.log('   newsMedia структура:', newsMedia);
        console.log('   newsMedia.flat():', newsMedia.flat());

        const flatFiles = newsMedia.flat();
        console.log(`   Всего файлов после flat(): ${flatFiles.length}`);

        flatFiles.forEach((file, index) => {
            if (file && file.type && file.type.startsWith('image')) {
                console.log(`   📷 Файл ${index + 1}:`, {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified
                });
                formData.append('images', file);
            } else {
                console.log(`   ⚠️ Файл ${index + 1} пропущен:`, file);
            }
        });

        // ЛОГИРОВАНИЕ СОДЕРЖИМОГО FORMDATA
        console.log('📤 [CLIENT] Содержимое FormData:');
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`   ${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
            } else {
                console.log(`   ${key}: ${value}`);
            }
        }

        const actionToDispatch = isDeferred ? createScheduledNews : createNews;

        console.log(`🚀 [CLIENT] Отправка ${isDeferred ? 'отложенной' : 'немедленной'} новости...`);

        // Если редактируем существующую запланированную новость - сначала отменяем старую
        const saveNews = async () => {
            if (scheduledNewsIdToCancel) {
                console.log(`🗑️ [CLIENT] Отмена старой запланированной новости ID: ${scheduledNewsIdToCancel}`);
                try {
                    await dispatch(cancelScheduledNews(scheduledNewsIdToCancel)).unwrap();
                    console.log('✅ [CLIENT] Старая запланированная новость отменена');
                } catch (cancelError) {
                    console.error('⚠️ [CLIENT] Ошибка отмены старой новости:', cancelError);
                    // Продолжаем сохранение даже при ошибке отмены
                }
            }
            
            return dispatch(actionToDispatch(formData)).unwrap();
        };

        saveNews()
            .then((response) => {
                console.log('✅ [CLIENT] Успешный ответ:', response);

                if (isDeferred) {
                    const scheduledTime = response.scheduledNews?.scheduledDate || response.scheduledNews?.publishDate;
                    const moscowTime = scheduledTime
                        ? MoscowTimeUtils.formatMoscowTime(scheduledTime)
                        : MoscowTimeUtils.formatMoscowTime(deferredDate);

                    setErrors((prev) => ({
                        ...prev,
                        submit: `✅ Новость запланирована на ${moscowTime} (московское время)!`,
                    }));

                    setTimeout(() => {
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                        onSave();
                    }, 2000);
                } else {
                    dispatch(fetchAllNews());
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                    onSave();
                }
            })
            .catch((error) => {
                console.error('❌ [CLIENT] Ошибка при создании новости:', error);

                if (isDeferred && deferredDate) {
                    MoscowTimeUtils.debugTime('Время при ошибке', deferredDate);
                }

                if (error.errors) {
                    const newErrors = {};
                    error.errors.forEach((err) => {
                        newErrors[err.path] = err.msg;
                    });
                    setErrors((prev) => ({
                        ...prev,
                        ...newErrors,
                        submit: 'Пожалуйста, исправьте ошибки в форме.',
                    }));
                } else {
                    setErrors((prev) => ({
                        ...prev,
                        submit:
                            error.error ||
                            'Произошла ошибка при сохранении новости.',
                    }));
                }
            });
    };

    const handleInputChange = (field, value) => {
        switch (field) {
            case 'title':
                setNewsTitle(value);
                break;
            case 'content':
                setNewsContent(value);
                break;
            case 'videoUrl':
                setVideoUrl(value);
                break;
            case 'publishDate':
                setPublishDate(value);
                break;
            case 'deferredDate':
                setDeferredDate(value);
                break;
            default:
                break;
        }
        validateField(field, value);
    };

    const handleDeferredToggle = (e) => {
        const checked = e.target.checked;
        setIsDeferred(checked);
        if (!checked) {
            setDeferredDate('');
            setErrors((prev) => ({ ...prev, deferredDate: '' }));
        }
    };

    const handleCategoryChange = (e) => {
        const { value, checked } = e.target;
        setSelectedCategoryIds((prev) => {
            if (checked) {
                return [...prev, parseInt(value)];
            } else {
                return prev.filter((id) => id !== parseInt(value));
            }
        });
        validateField(
            'categories',
            checked
                ? [...selectedCategoryIds, parseInt(value)]
                : selectedCategoryIds.filter((id) => id !== parseInt(value)),
        );
    };

    const handleMediaChange = (e, index) => {
        const files = Array.from(e.target.files);
        setNewsMedia((prevMedia) => {
            const updatedMedia = [...prevMedia];
            updatedMedia[index] = files;
            return updatedMedia;
        });
    };

    const addNewsMediaField = () => {
        setNewsMedia([...newsMedia, []]);
    };

    const removeMedia = (index, fileIndex) => {
        setNewsMedia((prevMedia) => {
            const updatedMedia = prevMedia.map((group, idx) =>
                idx === index ? group.filter((_, i) => i !== fileIndex) : group,
            );
            return updatedMedia;
        });
    };

    const openCropModal = (groupIndex, fileIndex) => {
        const file = newsMedia[groupIndex][fileIndex];
        if (file && file.type.startsWith('image')) {
            setCropModal({
                isOpen: true,
                image: {
                    src: URL.createObjectURL(file),
                    name: file.name,
                },
                groupIndex,
                fileIndex,
            });
        }
    };

    const handleCropComplete = (croppedImage) => {
        const { groupIndex, fileIndex } = cropModal;

        // Revoke the previous object URL to free memory
        URL.revokeObjectURL(cropModal.image.src);

        setNewsMedia((prevMedia) => {
            const updatedMedia = [...prevMedia];
            updatedMedia[groupIndex] = [...updatedMedia[groupIndex]];
            updatedMedia[groupIndex][fileIndex] = croppedImage;
            return updatedMedia;
        });

        setCropModal({
            isOpen: false,
            image: null,
            groupIndex: null,
            fileIndex: null,
        });
    };

    const closeCropModal = () => {
        if (cropModal.image) {
            URL.revokeObjectURL(cropModal.image.src);
        }
        setCropModal({
            isOpen: false,
            image: null,
            groupIndex: null,
            fileIndex: null,
            isExisting: false,
            existingIndex: null,
        });
    };

    // Обработка обрезки существующего изображения
    const openCropModalForExisting = async (url, index) => {
        try {
            // Загружаем изображение как blob
            const response = await fetch(url);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            
            setCropModal({
                isOpen: true,
                image: {
                    src: objectUrl,
                    name: `existing-image-${index}.jpg`,
                },
                groupIndex: null,
                fileIndex: null,
                isExisting: true,
                existingIndex: index,
                existingUrl: url,
            });
        } catch (error) {
            console.error('Ошибка загрузки изображения для обрезки:', error);
            alert('Не удалось загрузить изображение для редактирования');
        }
    };

    // Обработка завершения обрезки для существующего изображения
    const handleCropCompleteForExisting = (croppedImage) => {
        const { existingIndex } = cropModal;
        
        // Удаляем из существующих URL
        setExistingMediaUrls(prev => prev.filter((_, i) => i !== existingIndex));
        
        // Добавляем обрезанное изображение в newsMedia
        setNewsMedia(prev => {
            const updated = [...prev];
            if (updated[0]) {
                updated[0] = [...updated[0], croppedImage];
            } else {
                updated[0] = [croppedImage];
            }
            return updated;
        });
        
        // Закрываем модал
        if (cropModal.image) {
            URL.revokeObjectURL(cropModal.image.src);
        }
        setCropModal({
            isOpen: false,
            image: null,
            groupIndex: null,
            fileIndex: null,
            isExisting: false,
            existingIndex: null,
        });
    };

    const handleCancel = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        onCancel();
    };

    const getMinDateTime = () => {
        return MoscowTimeUtils.getMinDateTime();
    };

    const isEditing = !!scheduledNewsIdToCancel;

    return (
        <div className={styles.addNewsSection}>
            <h2>{isEditing ? 'Редактировать отложенную новость' : 'Добавить новость'}</h2>
            <div className={styles.addForm}>
                <label>Заголовок</label>
                <input
                    type="text"
                    value={newsTitle}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                />
                {errors.title && <p className={styles.error}>{errors.title}</p>}

                <label>Содержание</label>
                <RichTextEditor
                    value={newsContent}
                    onChange={(value) => handleInputChange('content', value)}
                />
                {errors.content && (
                    <p className={styles.error}>{errors.content}</p>
                )}

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
                                checked={selectedCategoryIds.includes(
                                    category.id,
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

                <label>Дата публикации (опционально)</label>
                <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) =>
                        handleInputChange('publishDate', e.target.value)
                    }
                />
                {errors.publishDate && (
                    <p className={styles.error}>{errors.publishDate}</p>
                )}

                <div className={styles.deferredSection}>
                    <label className={styles.deferredToggle}>
                        <input
                            type="checkbox"
                            checked={isDeferred}
                            onChange={handleDeferredToggle}
                            className={styles.checkboxInput}
                        />
                        <span className={styles.checkboxCustom}></span>
                        <FaClock className={styles.clockIcon} />
                        Отложенная публикация
                    </label>

                    {isDeferred && (
                        <div className={styles.deferredDateTime}>
                            <label>
                                <FaCalendarAlt
                                    className={styles.calendarIcon}
                                />
                                Дата и время публикации (московское время)
                            </label>
                            <input
                                type="datetime-local"
                                value={deferredDate}
                                min={getMinDateTime()}
                                onChange={(e) =>
                                    handleInputChange(
                                        'deferredDate',
                                        e.target.value,
                                    )
                                }
                                className={styles.deferredInput}
                            />
                            {errors.deferredDate && (
                                <p className={styles.error}>
                                    {errors.deferredDate}
                                </p>
                            )}
                            <p className={styles.deferredInfo}>
                                Новость будет автоматически опубликована в
                                указанное московское время.
                                {deferredDate && (
                                    <span className={styles.timePreview}>
                                        <br />
                                        📅 Выбрано:{' '}
                                        {MoscowTimeUtils.formatFull(
                                            deferredDate,
                                        )}
                                    </span>
                                )}
                            </p>
                        </div>
                    )}
                </div>

                <label>Изображения</label>
                
                {/* Существующие изображения при редактировании */}
                {existingMediaUrls.length > 0 && (
                    <div className={styles.existingMedia}>
                        <p className={styles.existingMediaLabel}>Текущие изображения ({existingMediaUrls.length}):</p>
                        <div className={styles.mediaPreview}>
                            {existingMediaUrls.map((url, index) => (
                                <div key={`existing-${index}`} className={styles.previewItem}>
                                    <div className={styles.previewActions}>
                                        <button
                                            type="button"
                                            className={styles.cropButton}
                                            onClick={() => openCropModalForExisting(url, index)}
                                            title="Обрезать изображение"
                                        >
                                            <FaCrop />
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.removeButton}
                                            onClick={() => {
                                                setExistingMediaUrls(prev => 
                                                    prev.filter((_, i) => i !== index)
                                                );
                                            }}
                                            title="Удалить изображение"
                                        >
                                            <FaDeleteLeft />
                                        </button>
                                    </div>
                                    <img
                                        src={url}
                                        alt={`Изображение ${index + 1}`}
                                        className={styles.imagePreview}
                                        onError={(e) => {
                                            console.error('Ошибка загрузки изображения:', url);
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML += '<span style="font-size:10px;color:#666;padding:5px;">Изображение недоступно</span>';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                        <p className={styles.existingMediaInfo}>
                            Эти изображения уже загружены. Нажмите ✂️ для обрезки или ❌ для удаления.
                        </p>
                    </div>
                )}
                
                {newsMedia.map((mediaGroup, index) => (
                    <div key={index}>
                        <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png"
                            onChange={(e) => handleMediaChange(e, index)}
                            className={styles.fileInput}
                        />
                        <div className={styles.mediaPreview}>
                            {mediaGroup.map((file, fileIndex) => (
                                <div
                                    key={fileIndex}
                                    className={styles.previewItem}
                                >
                                    <div className={styles.previewActions}>
                                        <button
                                            type="button"
                                            className={styles.cropButton}
                                            onClick={() => openCropModal(index, fileIndex)}
                                            title="Обрезать изображение"
                                        >
                                            <FaCrop />
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.removeButton}
                                            onClick={() =>
                                                removeMedia(index, fileIndex)
                                            }
                                            title="Удалить изображение"
                                        >
                                            <FaDeleteLeft />
                                        </button>
                                    </div>
                                    {file.type.startsWith('image') && (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            className={styles.imagePreview}
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
                    onClick={addNewsMediaField}
                >
                    + Добавить ещё файлы
                </button>
                <p className={styles.fileInfo}>
                    Допустимые форматы: JPG, PNG. Максимальный размер: 5MB
                </p>
                {errors.media && <p className={styles.error}>{errors.media}</p>}
                {errors.submit && (
                    <p
                        className={`${styles.error} ${errors.submit.includes('сохранена') ? styles.success : ''}`}
                    >
                        {errors.submit}
                    </p>
                )}

                <div className={styles.buttons}>
                    <button
                        className={`${styles.saveButton} ${isDeferred ? styles.deferredButton : ''}`}
                        onClick={handleSave}
                    >
                        {isDeferred ? (
                            <>
                                <FaClock />
                                Запланировать публикацию
                            </>
                        ) : (
                            'Опубликовать сейчас'
                        )}
                    </button>
                    <button
                        type="button"
                        className={styles.draftButton}
                        onClick={saveToDrafts}
                    >
                        Сохранить в черновики
                    </button>
                    <button
                        className={styles.cancelButton}
                        onClick={handleCancel}
                    >
                        Отмена
                    </button>
                </div>
            </div>

            {cropModal.isOpen && (
                <ImageCropModal
                    image={cropModal.image}
                    onCropComplete={cropModal.isExisting ? handleCropCompleteForExisting : handleCropComplete}
                    onCancel={closeCropModal}
                />
            )}
        </div>
    );
};
