import React from 'react';
import styles from './FooterContacts.module.scss';

export const FooterContacts = () => {
    return (
        <div className={styles.footerContacts}>
            <p>Телефон: +7 (873) 222-42-52</p>
            <p>Email: asetpost@mail.ru</p>
            <p>Адрес:</p> <p>г. Назрань,</p> <p>Набережный переулок, д. 8</p>
        </div>
    );
};
