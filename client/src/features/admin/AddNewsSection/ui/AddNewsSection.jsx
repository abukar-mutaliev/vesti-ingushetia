import React, { useState, useEffect } from 'react';
import styles from './AddNewsSection.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import { createNews, fetchAllNews } from '@entities/news/model/newsSlice.js';
import { RichTextEditor } from '@shared/ui/RichTextEditor';

export const AddNewsSection = ({ onSave, onCancel }) => {
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newMedia, setNewMedia] = useState([[]]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [errors, setErrors] = useState({});
    const categories = useSelector(selectCategories);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleMediaChange = (e, index) => {
        const files = Array.from(e.target.files);
        setNewMedia((prevMedia) => {
            const updatedMedia = [...prevMedia];
            updatedMedia[index] = files;
            return updatedMedia;
        });
    };

    const addNewMediaField = () => {
        setNewMedia([...newMedia, []]);
    };

    const validateFields = () => {
        const newErrors = {};

        if (!newTitle.trim()) {
            newErrors.title = 'Поле заголовка обязательно для заполнения.';
        }
        if (!newContent.trim()) {
            newErrors.content = 'Поле содержания обязательно для заполнения.';
        }
        if (!selectedCategoryId) {
            newErrors.category = 'Выберите категорию.';
        }
        const hasMedia = newMedia.some((mediaGroup) => mediaGroup.length > 0);
        if (!hasMedia) {
            newErrors.media = 'Добавьте хотя бы один файл.';
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateFields()) {
            return;
        }

        const formData = new FormData();
        formData.append('title', newTitle);
        formData.append('content', newContent);
        formData.append('categoryId', selectedCategoryId);

        newMedia.flat().forEach((file) => {
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

    return (
        <div className={styles.addNewsSection}>
            <h2>Добавить новость</h2>
            <div className={styles.addForm}>
                <label>Заголовок</label>
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                />
                {errors.title && <p className={styles.error}>{errors.title}</p>}

                <label>Содержание</label>
                <RichTextEditor value={newContent} onChange={setNewContent} />
                {errors.content && (
                    <p className={styles.error}>{errors.content}</p>
                )}

                <label>Категория</label>
                <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
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
                {newMedia.map((_, index) => (
                    <input
                        key={index}
                        type="file"
                        multiple
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
