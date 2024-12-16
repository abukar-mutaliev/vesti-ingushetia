import { useState, useEffect } from 'react';
import styles from './AddNewsSection.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import { createNews, fetchAllNews } from '@entities/news/model/newsSlice.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';
import { FaDeleteLeft } from 'react-icons/fa6';
import defaultImage from '@assets/default.jpg';

const LOCAL_STORAGE_KEY = 'adminDashboard_addNewsSectionFormData'; // Уникальный ключ

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

    const [selectedCategoryId, setSelectedCategoryId] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).selectedCategoryId || '' : '';
    });

    const [videoUrl, setVideoUrl] = useState(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved).videoUrl || '' : '';
    });

    const [newsMedia, setNewsMedia] = useState([[]]);
    const [errors, setErrors] = useState({});


    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    useEffect(() => {
        const formData = {
            newsTitle,
            newsContent,
            selectedCategoryId,
            videoUrl,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
    }, [newsTitle, newsContent, selectedCategoryId, videoUrl]);

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
            case 'category':
                if (!value) {
                    error = 'Выберите категорию.';
                }
                break;
            case 'media':
                if (!value || !value.some((group) => group.length > 0)) {
                    error = 'Необходимо добавить хотя бы одно изображение.';
                }
                break;
            case 'videoUrl':
                const rutubeRegex = /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
                const youtubeRegex = /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;
                if (value && !(rutubeRegex.test(value) || youtubeRegex.test(value))) {
                    error = 'Видео ссылка должна быть URL от Rutube или YouTube';
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
        const isCategoryValid = validateField('category', selectedCategoryId);
        const isVideoUrlValid = validateField('videoUrl', videoUrl);

        const isMediaValid = newsMedia.some((group) => group.length > 0);
        setErrors((prevErrors) => ({
            ...prevErrors,
            media: isMediaValid ? '' : 'Необходимо добавить хотя бы одно изображение.',
        }));

        return (
            isTitleValid && isContentValid && isCategoryValid && isVideoUrlValid && isMediaValid
        );
    };

    const handleSave = () => {
        if (!validateForm()) return;

        const formData = new FormData();
        formData.append('title', newsTitle);
        formData.append('content', newsContent);
        formData.append('categoryId', selectedCategoryId);

        if (videoUrl.trim() !== '') {
            formData.append('videoUrl', videoUrl.trim());
        }

        newsMedia.flat().forEach((file) => {
            if (file.type.startsWith('image')) {
                formData.append('images', file);
            }
        });

        dispatch(createNews(formData))
        .unwrap()
        .then(() => {
            dispatch(fetchAllNews());
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            onSave();
        })
        .catch((error) => {
            console.error('Ошибка при создании новости:', error);
            setErrors((prevErrors) => ({
                ...prevErrors,
                submit: 'Произошла ошибка при сохранении новости. Пожалуйста, попробуйте ещё раз.',
            }));
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
            case 'category':
                setSelectedCategoryId(value);
                break;
            case 'videoUrl':
                setVideoUrl(value);
                break;
            default:
                break;
        }
        validateField(field, value);
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
                idx === index ? group.filter((_, i) => i !== fileIndex) : group
            );
            return updatedMedia;
        });
    };

    const handleCancel = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        onCancel();
    };

    return (
        <div className={styles.addNewsSection}>
            <h2>Добавить новость</h2>
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

                <label>Категория</label>
                <select
                    value={selectedCategoryId}
                    onChange={(e) => handleInputChange('category', e.target.value)}
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

                <label>Изображения</label>
                {newsMedia.map((mediaGroup, index) => (
                    <div key={index}>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
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
