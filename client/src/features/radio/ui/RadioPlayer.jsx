import React from 'react';
import ReactPlayer from 'react-player';
import styles from './RadioPlayer.module.scss';

export const RadioPlayer = ({
    radio,
    currentRadio,
    status,
    error,
    onPlay,
    onStop,
}) => {
    return (
        <div className={styles.RadioPlayerWrapper}>
            <h2>Радио России "Ингушетия"</h2>
            <p>
                Выходит в эфир по будням 5 раз в сутки и по 2 раза в выходные
                дни. Включается на частоту Радио России с 11.10 по 12.00 с 13.45
                по 14.00 с 15.10 по 16.00 с 17.45 по 18.00 с 18.10 по 19.00
            </p>
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
                Телефон: <a href="tel:8(8732)-22-41-34">8 (8732)-22-41-34</a>
            </p>

            {status === 'loading' && <p>Загрузка...</p>}
            {error && <p>Ошибка: {error}</p>}

            <ul className={styles.TrackList}>
                {radio.map((track) => (
                    <li
                        key={track.id}
                        className={`${styles.TrackItem} ${
                            currentRadio && currentRadio.id === track.id
                                ? styles.active
                                : ''
                        }`}
                        onClick={() => onPlay(track.id)}
                    >
                        <span>{track.title}</span>
                    </li>
                ))}
            </ul>

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
};
