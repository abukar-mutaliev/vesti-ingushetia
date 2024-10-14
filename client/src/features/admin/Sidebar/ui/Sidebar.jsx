import React from 'react';
import styles from './Sidebar.module.scss';

export const Sidebar = ({ onSectionChange }) => {
    return (
        <div className={styles.sidebar}>
            <div className={styles.logo}>
                <h2>Панель Администратора </h2>
            </div>
            <ul className={styles.menu}>
                <li onClick={() => onSectionChange('news')}>Новости</li>
                <li onClick={() => onSectionChange('comments')}>Комментарии</li>
                <li onClick={() => onSectionChange('categories')}>Категории</li>
                <li onClick={() => onSectionChange('users')}>Пользователи</li>
            </ul>
        </div>
    );
};
