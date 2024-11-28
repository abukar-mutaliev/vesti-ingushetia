import React from 'react';
import smotrim from '@assets/smotrim_logo.png';
import styles from './FooterSmotrim.module.scss';

export const FooterSmotrim = () => {
    return (
        <div className={styles.footerSmotrim}>
            <a
                href="https://smotrim.ru/brand/68199"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img src={smotrim} alt="RuTube" />
            </a>
        </div>
    );
};
