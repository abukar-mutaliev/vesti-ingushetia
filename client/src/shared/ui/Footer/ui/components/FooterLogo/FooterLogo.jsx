import React from 'react';
import styles from './FooterLogo.module.scss';
import { Link } from 'react-router-dom';
import { Logo } from '../../../../Logo';
import { FooterSmotrim } from '@shared/ui/Footer/ui/components/FooterSmotrim/FooterSmotrim.jsx';

export const FooterLogo = () => {
    return (
        <div className={styles.footerLogo}>
            <Logo />
            <FooterSmotrim />
        </div>
    );
};
