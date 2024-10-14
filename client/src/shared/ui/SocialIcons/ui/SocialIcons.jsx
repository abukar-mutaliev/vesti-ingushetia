import React from 'react';
import styles from './SocialIcons.module.scss';
import { FaVk, FaTelegramPlane, FaYoutube } from 'react-icons/fa';
import RuTube from '../../../../assets/ruTube-icon.svg';

export const SocialIcons = () => (
    <div className={styles.socialIcons}>
        <a
            href="http://www.youtube.com/@TV-qy3zm"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.icon} ${styles.youTube}`}
        >
            <FaYoutube />
        </a>
        <a
            href="https://rutube.ru/channel/1338219/videos/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.icon} ${styles.ruTube}`}
        >
            <img src={RuTube} alt="RuTube" />
        </a>
        <a
            href="https://t.me/gtrk_ingushetia"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.icon} ${styles.telegramIcon}`}
        >
            <FaTelegramPlane />
        </a>
        <a
            href="https://vk.com/gtrk_ingushetia"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.icon} ${styles.vkIcon}`}
        >
            <FaVk />
        </a>
    </div>
);
