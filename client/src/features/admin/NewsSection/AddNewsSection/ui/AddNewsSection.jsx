import React, { useState, useEffect } from 'react';
import styles from './AddNewsSection.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import { createNews, fetchAllNews } from '@entities/news/model/newsSlice.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';
import { FaDeleteLeft } from 'react-icons/fa6';

export const AddNewsSection = ({ onSave, onCancel }) => {
    const [newsTitle, setNewsTitle] = useState('');
    const [newsContent, setNewsContent] = useState('');
    const [newsMedia, setNewsMedia] = useState([[]]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [errors, setErrors] = useState({});
    const categories = useSelector(selectCategories);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

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
        const isTitleValid = validateField('title', newsTitle);
        const isContentValid = validateField('content', newsContent);
        const isCategoryValid = validateField('category', selectedCategoryId);
        const isMediaValid = validateField('media', newsMedia);

        return (
            isTitleValid && isContentValid && isCategoryValid && isMediaValid
        );
    };

    const handleSave = () => {
        if (!validateForm()) return;

        const formData = new FormData();
        formData.append('title', newsTitle);
        formData.append('content', newsContent);
        formData.append('categoryId', selectedCategoryId);

        newsMedia.flat().forEach((file) => {
            if (file.type.startsWith('image')) {
                formData.append('images', file);
            } else if (file.type.startsWith('video')) {
                formData.append('videos', file);
            }
        });

        dispatch(createNews(formData))
            .unwrap()
            .then(() => {
                dispatch(fetchAllNews());
                onSave();
            })
            .catch((error) => {
                console.error('Ошибка при создании новости:', error);
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
        validateField('media', newsMedia);
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
        validateField('media', newsMedia);
    };

    const isFormValid = () => {
        return (
            !errors.title &&
            !errors.content &&
            !errors.category &&
            !errors.media &&
            newsTitle.trim().length > 0 &&
            newsContent.trim().length > 0 &&
            selectedCategoryId &&
            newsMedia.some((mediaGroup) => mediaGroup.length > 0)
        );
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

                <label>Медиафайлы</label>
                {newsMedia.map((mediaGroup, index) => (
                    <div key={index}>
                        <input
                            type="file"
                            multiple
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
                                        />
                                    ) : (
                                        <video
                                            src={URL.createObjectURL(file)}
                                            controls
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
                    onClick={addNewsMediaField}
                >
                    + Добавить еще файлы
                </button>
                {errors.media && <p className={styles.error}>{errors.media}</p>}

                <div className={styles.buttons}>
                    <button className={styles.saveButton} onClick={handleSave}>
                        Сохранить
                    </button>
                    <button className={styles.cancelButton} onClick={onCancel}>
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
};
