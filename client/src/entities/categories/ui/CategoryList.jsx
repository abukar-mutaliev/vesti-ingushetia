import { shallowEqual, useSelector } from 'react-redux';
import {
    selectCategories,
    selectCategoriesLoading,
    selectCategoriesError,
} from '../model/categorySelectors';
import { Link, useLocation } from 'react-router-dom';
import styles from './CategoryList.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';
import { memo } from 'react';

export const CategoryList = memo(() => {
    const categories = useSelector(selectCategories, shallowEqual);
    const loading = useSelector(selectCategoriesLoading);
    const error = useSelector(selectCategoriesError);
    const location = useLocation();

    const isActiveCategory = (categoryId) =>
        location.pathname === `/categories/${categoryId}`;

    if (loading) {
        return (
            <div style={{ marginTop: '25rem', height: '50vh' }}>
                <Loader />
            </div>
        );
    }
    if (error) {
        return <div>Error: {error}</div>;
    }
    return (
        <ul className={styles.categoryList}>
            {categories.map((category) => (
                <li
                    key={category.id}
                    className={
                        isActiveCategory(category.id) ? styles.active : ''
                    }
                >
                    <Link to={`/categories/${category.id}`}>
                        {category.name}
                    </Link>
                </li>
            ))}
        </ul>
    );
});
