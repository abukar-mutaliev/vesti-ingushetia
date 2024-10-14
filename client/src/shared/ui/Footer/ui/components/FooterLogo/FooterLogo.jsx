import React from 'react';
import styles from './FooterLogo.module.scss';
import { Link } from 'react-router-dom';
import { Logo } from '../../../../Logo';

export const FooterLogo = () => {
    return (
        <div className={styles.footerLogo}>
            <Logo />
        </div>
    );
};
