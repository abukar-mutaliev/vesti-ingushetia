import React from 'react';
import styles from './FooterBottom.module.scss';
import { FooterLegal } from '../FooterLegal/FooterLegal';

export const FooterBottom = () => {
    return (
        <div className={styles.footerBottom}>
            <FooterLegal />
        </div>
    );
};
