import React from 'react';
import styles from './SideMenu.module.scss';
import { CategoryList } from '@entities/categories/index.js';

export const SideMenu = () => {
    return (
        <div className={styles.sideMenu}>
            <h3>Категории</h3>
            <div>
                <CategoryList />
            </div>
        </div>
    );
};
