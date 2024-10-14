import React from 'react';
import styles from './FooterSocialIcons.module.scss';
import { FaTelegramPlane, FaVk, FaYoutube } from 'react-icons/fa';
import RuTube from '../../../../../../assets/ruTube-icon.svg';

export const FooterSocialIcons = () => {
    return (
        <div className={styles.footerSocialIcons}>
            <a
                href="https://rutube.ru/channel/1338219/videos/"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img
                    src={RuTube}
                    alt="RuTube"
                    className={`${styles.icon} ${styles.ruTube}`}
                />
            </a>
            <a
                href="https://vk.com/gtrk_ingushetia"
                target="_blank"
                rel="noopener noreferrer"
            >
                <FaVk />
            </a>
            <a
                href="http://www.youtube.com/@TV-qy3zm"
                target="_blank"
                rel="noopener noreferrer"
            >
                <FaYoutube />
            </a>
            <a
                href="https://t.me/gtrk_ingushetia"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.icon} ${styles.telegramIcon}`}
            >
                <FaTelegramPlane />
            </a>
        </div>
    );
};
