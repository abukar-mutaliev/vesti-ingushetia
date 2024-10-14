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
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState(null);
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

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        setEditMedia((prevMedia) => [...prevMedia, ...files]);
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

    const handleSave = () => {
        if (!editTitle || !editContent || !selectedCategoryId) {
            setError('Пожалуйста, заполните все поля.');
            return;
        }

        if (editMedia.length === 0) {
            setError('Пожалуйста, добавьте хотя бы один медиафайл.');
            return;
        }

        const formData = new FormData();
        formData.append('title', editTitle);
        formData.append('content', editContent);
        formData.append('categoryId', selectedCategoryId);

        editMedia.forEach((file) => {
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

    return (
        <div className={styles.editNewsSection}>
            <h2>Редактировать новость</h2>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.editForm}>
                <label>Заголовок</label>
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                />

                <label>Содержание</label>
                <RichTextEditor value={editContent} onChange={setEditContent} />

                {editMedia.length > 0 ? (
                    editMedia.map((media, index) => (
                        <div key={index} className={styles.mediaItem}>
                            {media.type.startsWith('image') ? (
                                <img
                                    className={styles.media}
                                    src={`http://localhost:5000/${media.url}`}
                                    alt="media"
                                />
                            ) : (
                                <video
                                    className={styles.media}
                                    src={`http://localhost:5000/${media.url}`}
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

                <label>Медиафайлы</label>
                <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                />

                {editMedia.length > 0 && (
                    <div className={styles.mediaPreview}>
                        {editMedia.map((file, index) => (
                            <p key={index}>Файл загружен: {file.name}</p>
                        ))}
                    </div>
                )}

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
