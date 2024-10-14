import React from 'react';
import styles from './FooterTop.module.scss';
import { FooterLogo } from '../FooterLogo/FooterLogo';
import { FooterNav } from '../FooterNav/FooterNav';
import { FooterSocialIcons } from '../FooterSocialIcons/FooterSocialIcons';
import { FooterContacts } from '../FooterContacts/FooterContacts';

export const FooterTop = () => {
    return (
        <div className={styles.footerTop}>
            <FooterLogo />
            <FooterNav />
            <FooterSocialIcons />
            <FooterContacts />
        </div>
    );
};
