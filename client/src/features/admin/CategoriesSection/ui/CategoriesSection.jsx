import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './CategoriesSection.module.scss';
import {
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '@entities/categories/model/categorySlice';
import {
    selectCategories,
    selectCategoriesLoading,
    selectCategoriesError,
} from '@entities/categories/model/categorySelectors';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal';

export const CategoriesSection = () => {
    const dispatch = useDispatch();
    const categories = useSelector(selectCategories);
    const loading = useSelector(selectCategoriesLoading);
    const error = useSelector(selectCategoriesError);

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [errors, setErrors] = useState({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const openDeleteModal = (id) => {
        setCategoryIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setCategoryIdToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (categoryIdToDelete) {
            dispatch(deleteCategory(categoryIdToDelete))
                .unwrap()
                .then(() => {
                    dispatch(fetchCategories());
                    closeDeleteModal();
                });
        }
    };

    const validateField = (name, value) => {
        let error = '';

        if (name === 'categoryName') {
            if (!value.trim()) {
                error = 'Название категории обязательно';
            } else if (value.length < 3) {
                error =
                    'Название категории должно содержать не менее 3 символов';
            }
        }

        setErrors((prev) => ({ ...prev, [name]: error }));
        return error === '';
    };

    const handleCategoryNameChange = (e) => {
        const { value } = e.target;
        setCategoryName(value);
        validateField('categoryName', value);
    };

    const handleAddCategory = () => {
        if (!validateField('categoryName', categoryName)) return;

        dispatch(createCategory({ name: categoryName }))
            .unwrap()
            .then(() => {
                dispatch(fetchCategories());
                setIsAddingCategory(false);
                setCategoryName('');
                setErrors({});
            });
    };

    const handleEditCategory = (category) => {
        setCategoryToEdit(category);
        setCategoryName(category.name);
        setIsEditingCategory(true);
    };

    const handleUpdateCategory = () => {
        if (!validateField('categoryName', categoryName)) return;

        dispatch(
            updateCategory({
                id: categoryToEdit.id,
                category: { name: categoryName },
            }),
        )
            .unwrap()
            .then(() => {
                dispatch(fetchCategories());
                setIsEditingCategory(false);
                setCategoryToEdit(null);
                setCategoryName('');
                setErrors({});
            });
    };

    const isFormValid = () => {
        return !errors.categoryName && categoryName.trim().length > 0;
    };

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Категории</h1>
                {!isAddingCategory && !isEditingCategory && (
                    <button
                        className={styles.create}
                        onClick={() => setIsAddingCategory(true)}
                    >
                        + Добавить категорию
                    </button>
                )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {(isAddingCategory || isEditingCategory) && (
                <div className={styles.editForm}>
                    <label>Название категории</label>
                    <input
                        type="text"
                        value={categoryName}
                        onChange={handleCategoryNameChange}
                    />
                    {errors.categoryName && (
                        <p className={styles.error}>{errors.categoryName}</p>
                    )}

                    <div className={styles.buttons}>
                        {isEditingCategory ? (
                            <>
                                <button
                                    className={styles.saveButton}
                                    onClick={handleUpdateCategory}
                                    disabled={!isFormValid()}
                                >
                                    Сохранить
                                </button>
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => {
                                        setIsEditingCategory(false);
                                        setCategoryToEdit(null);
                                        setCategoryName('');
                                        setErrors({});
                                    }}
                                >
                                    Отмена
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className={styles.saveButton}
                                    onClick={handleAddCategory}
                                    disabled={!isFormValid()}
                                >
                                    Добавить
                                </button>
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => {
                                        setIsAddingCategory(false);
                                        setCategoryName('');
                                        setErrors({});
                                    }}
                                >
                                    Отмена
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.mobileHide}>Id</th>
                            <th>Название</th>
                            <th>Редактировать</th>
                            <th>Удалить</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category.id}>
                                <td className={styles.mobileHide}>
                                    {category.id}
                                </td>
                                <td>{category.name}</td>
                                <td className={styles.actionsCell}>
                                    <button
                                        className={styles.editButton}
                                        onClick={() =>
                                            handleEditCategory(category)
                                        }
                                    >
                                        Изменить
                                    </button>
                                </td>
                                <td>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() =>
                                            openDeleteModal(category.id)
                                        }
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                description="Вы уверены, что хотите удалить эту категорию?"
            />
        </div>
    );
};
