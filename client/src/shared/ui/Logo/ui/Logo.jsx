import styles from './Logo.module.scss';
import { Link } from 'react-router-dom';
import React from 'react';

export const Logo = () => {
    return (
        <div className={styles.logo}>
            <Link to="/">
                ВЕСТИ
                <span>ИНГУШЕТИЯ</span>
            </Link>
        </div>
    );
};
