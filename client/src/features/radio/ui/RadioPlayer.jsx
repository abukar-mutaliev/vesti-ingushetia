import { memo, useMemo } from 'react';
import ReactPlayer from 'react-player';
import styles from './RadioPlayer.module.scss';
import { IoPlayCircle } from 'react-icons/io5';
import { Loader } from '@shared/ui/Loader/index.js';

const SLOTS = [
    ['11:10', '12:00'],
    ['13:45', '14:00'],
    ['15:10', '16:00'],
    ['17:45', '18:00'],
    ['18:10', '19:00'],
];

export const RadioPlayer = memo(
    ({ radio, currentRadio, status, error, onPlay, onStop }) => {
        const tracks = Array.isArray(radio) ? radio : [];

        const trackList = useMemo(() => {
            return tracks.map((track) => {
                const isActive = currentRadio && currentRadio.id === track.id;
                return (
                    <li key={track.id}>
                        <button
                            type="button"
                            className={`${styles.trackItem} ${
                                isActive ? styles.trackItemActive : ''
                            }`}
                            onClick={() => onPlay(track.id)}
                        >
                            <span className={styles.playIcon} aria-hidden>
                                <IoPlayCircle size={28} />
                            </span>
                            <span className={styles.trackTitle}>{track.title}</span>
                            {isActive && (
                                <span className={styles.onAir}>В эфире</span>
                            )}
                        </button>
                    </li>
                );
            });
        }, [tracks, currentRadio, onPlay]);

        return (
            <div className={styles.player}>
                <header className={styles.header}>
                    <span className={styles.eyebrow}>ГТРК «Ингушетия»</span>
                    <h1 className={styles.title}>Радио России «Ингушетия»</h1>
                    <p className={styles.subtitle}>
                        Выходит в эфир по будням 5 раз в сутки и по 2 раза в
                        выходные дни.
                    </p>
                </header>

                <div className={styles.infoGrid}>
                    <section className={styles.infoCard}>
                        <h2>Расписание</h2>
                        <p className={styles.infoLead}>
                            Включается на частоту Радио России
                        </p>
                        <ul className={styles.slots}>
                            {SLOTS.map(([from, to]) => (
                                <li key={from}>
                                    <span>{from}</span>
                                    <span className={styles.slotDash} />
                                    <span>{to}</span>
                                </li>
                            ))}
                        </ul>
                        <p className={styles.wave}>
                            Волна вещания
                            <strong>101.3 FM</strong>
                        </p>
                    </section>

                    <section className={styles.infoCard}>
                        <h2>Контакты</h2>
                        <dl className={styles.contacts}>
                            <div>
                                <dt>Адрес</dt>
                                <dd>
                                    Республика Ингушетия, г. Назрань,
                                    Набережный 8
                                </dd>
                            </div>
                            <div>
                                <dt>E-mail</dt>
                                <dd>
                                    <a href="mailto:radio.ingushetiya@mail.ru">
                                        radio.ingushetiya@mail.ru
                                    </a>
                                </dd>
                            </div>
                            <div>
                                <dt>Телефон</dt>
                                <dd>
                                    <a href="tel:+78732224134">
                                        8 (8732) 22-41-34
                                    </a>
                                </dd>
                            </div>
                        </dl>
                    </section>
                </div>

                <section className={styles.tracks}>
                    <h2>Записи эфира</h2>
                    {status === 'loading' && (
                        <div className={styles.loaderWrap}>
                            <Loader />
                        </div>
                    )}
                    {typeof error === 'string' && error && (
                        <p className={styles.error}>Ошибка: {error}</p>
                    )}
                    {tracks.length > 0 ? (
                        <ul className={styles.trackList}>{trackList}</ul>
                    ) : (
                        status !== 'loading' && (
                            <p className={styles.empty}>Радиозаписей пока нет</p>
                        )
                    )}
                    {tracks.length > 0 && !currentRadio && (
                        <p className={styles.hint}>
                            Выберите запись для прослушивания
                        </p>
                    )}
                </section>

                {currentRadio && (
                    <div className={styles.nowPlaying}>
                        <div className={styles.nowPlayingText}>
                            <span className={styles.nowLabel}>Сейчас играет</span>
                            <h2>{currentRadio.title}</h2>
                            {currentRadio.description && (
                                <p>{currentRadio.description}</p>
                            )}
                        </div>
                        <ReactPlayer
                            url={currentRadio.url}
                            className={styles.radioPlayer}
                            playing
                            controls
                            width="100%"
                            height="54px"
                        />
                        <button
                            type="button"
                            className={styles.stopButton}
                            onClick={onStop}
                        >
                            Остановить
                        </button>
                    </div>
                )}
            </div>
        );
    },
);
