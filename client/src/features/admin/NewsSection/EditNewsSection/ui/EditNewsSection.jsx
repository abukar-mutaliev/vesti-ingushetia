import React, { useState, useEffect } from 'react';
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
        }
        dispatch(fetchCategories());
    }, [news, dispatch]);

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
        return isTitleValid && isContentValid && isCategoryValid;
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

                <label>Медиафайлы</label>
                {editMedia.length > 0 ? (
                    editMedia.map((media, index) => (
                        <div key={index} className={styles.mediaItem}>
                            {media.type.startsWith('image') ? (
                                <img
                                    className={styles.media}
                                    src={`${media.url}`}
                                    alt="media"
                                />
                            ) : (
                                <video
                                    className={styles.media}
                                    src={`${media.url}`}
                                    controls
                                />
                            )}
                            <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteMedia(index)}
                            >
                                <FaDeleteLeft size={20} />
                            </button>
                        </div>
                    ))
                ) : (
                    <p>Нет загруженных медиафайлов</p>
                )}

                <label>Новые медиафайлы</label>
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
