import React from 'react';
import styles from './FooterTop.module.scss';
import { FooterLogo } from '../FooterLogo/FooterLogo';
import { FooterNav } from '../FooterNav/FooterNav';
import { FooterSocialIcons } from '../FooterSocialIcons/FooterSocialIcons';
import { FooterContacts } from '../FooterContacts/FooterContacts';
import { FooterSmotrim } from '@shared/ui/Footer/ui/components/FooterSmotrim/FooterSmotrim.jsx';

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
