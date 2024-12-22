import React, { memo, useMemo } from 'react';
import ReactPlayer from 'react-player';
import styles from './RadioPlayer.module.scss';
import {
    IoPlayCircleOutline,
    IoPlaySkipForwardCircleSharp,
} from 'react-icons/io5';
import { Loader } from '@shared/ui/Loader/index.js';

export const RadioPlayer = memo(
    ({ radio, currentRadio, status, error, onPlay, onStop }) => {
        const trackList = useMemo(() => {
            return radio.map((track) => (
                <li
                    key={track.id}
                    className={`${styles.trackItemContainer} ${
                        currentRadio && currentRadio.id === track.id
                            ? styles.active
                            : ''
                    }`}
                    onClick={() => onPlay(track.id)}
                >
                    <IoPlaySkipForwardCircleSharp size={30} />
                    <span className={styles.trackItem}>{track.title}</span>
                </li>
            ));
        }, [radio, currentRadio, onPlay]);

        return (
            <div className={styles.RadioPlayerWrapper}>
                <h2>Радио России "Ингушетия"</h2>
                <p>
                    Выходит в эфир по будням 5 раз в сутки и по 2 раза в
                    выходные дни.
                </p>

                <ul>
                    <h3>Включается на частоту Радио России</h3>
                    <li>с 11.10 по 12.00</li>
                    <li>с 13.45 по 14.00</li>
                    <li>с 15.10 по 16.00</li>
                    <li>с 17.45 по 18.00</li>
                    <li>с 18.10 по 19.00</li>
                </ul>
                <h3>Волна вещания - 101.3 ФМ</h3>
                <h3>Контакты:</h3>
                <p>
                    Адрес редакции:{' '}
                    <a>Республика Ингушетия, г.Назрань, Набережный 8.</a>
                </p>
                <p>
                    E-mail:{' '}
                    <a href="mailto:radio.ingushetiya@mail.ru">
                        radio.ingushetiya@mail.ru
                    </a>
                </p>
                <p>
                    Телефон:{' '}
                    <a href="tel:8(8732)-22-41-34">8 (8732)-22-41-34</a>
                </p>

                {status === 'loading' && <Loader />}
                {error && <p>Ошибка: {error}</p>}

                <ul className={styles.TrackList}>{trackList}</ul>

                {currentRadio ? (
                    <div className={styles.radioPlayer}>
                        <h2>{currentRadio.title}</h2>
                        <h3>{currentRadio.description}</h3>
                        <ReactPlayer
                            url={currentRadio.url}
                            playing
                            controls
                            width="100%"
                            height="20px"
                        />
                    </div>
                ) : (
                    <p>Выберите радио для прослушивания</p>
                )}

                {currentRadio && (
                    <button className={styles.Button} onClick={onStop}>
                        Остановить
                    </button>
                )}
            </div>
        );
    },
);
