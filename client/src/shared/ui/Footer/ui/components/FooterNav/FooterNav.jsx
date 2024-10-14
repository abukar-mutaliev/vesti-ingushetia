import React from 'react';
import styles from './FooterNav.module.scss';
import { Link } from 'react-router-dom';

export const FooterNav = () => {
    return (
        <nav className={styles.footerNav}>
            <ul>
                <li>
                    <Link to="/news">Новости</Link>
                </li>
                <li>
                    <Link to="/tv">ТВ</Link>
                </li>
                <li>
                    <Link to="/about">О нас</Link>
                </li>
            </ul>
        </nav>
    );
};
