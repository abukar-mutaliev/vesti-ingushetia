import React from 'react';
import { useSelector } from 'react-redux';
import {
    selectCategories,
    selectCategoriesLoading,
    selectCategoriesError,
} from '../model/categorySelectors';
import { Link, useLocation } from 'react-router-dom';
import { PuffLoader } from 'react-spinners';
import styles from './CategoryList.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';

export const CategoryList = () => {
    const categories = useSelector(selectCategories);
    const loading = useSelector(selectCategoriesLoading);
    const error = useSelector(selectCategoriesError);
    const location = useLocation();

    if (loading)
        return (
            <div style={{ marginTop: '25rem', height: '50vh' }}>
                <Loader />
            </div>
        );

    if (error) return <div>Error: {error}</div>;

    return (
        <ul className={styles.categoryList}>
            {categories.map((category) => (
                <li
                    key={category.id}
                    className={
                        location.pathname === `/categories/${category.id}`
                            ? styles.active
                            : ''
                    }
                >
                    <Link to={`/categories/${category.id}`}>
                        {category.name}
                    </Link>
                </li>
            ))}
        </ul>
    );
};
