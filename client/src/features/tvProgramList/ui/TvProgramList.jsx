import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllTvPrograms } from '@entities/tvProgram/model/tvProgramSlice';
import {
    selectAllTvPrograms,
    selectTvProgramStatus,
} from '@entities/tvProgram/model/tvProgramSelectors';
import styles from './TvProgramList.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const DAY_RE = /^(\d{1,2})\s+[а-яё]+(?:,\s*[а-яё]+)?$/i;
const SLOT_RE =
    /^((?:\d{1,2}:\d{2}(?:\s*[-–—]\s*\d{1,2}:\d{2})?)(?:\s*;\s*\d{1,2}:\d{2}(?:\s*[-–—]\s*\d{1,2}:\d{2})?)*)\s*[-–—]\s+(.+)$/;

const decodeHtml = (value) =>
    value
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>');

const htmlToLines = (html = '') =>
    decodeHtml(
        html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
            .replace(/<[^>]+>/g, ''),
    )
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

const padTime = (value) =>
    value.replace(
        /^(\d{1,2}):(\d{2})$/,
        (_, hours, minutes) => `${hours.padStart(2, '0')}:${minutes}`,
    );

const formatRanges = (timePart) =>
    timePart.split(/\s*;\s*/).map((range) =>
        range
            .trim()
            .replace(/\s*[-–—]\s*/g, '–')
            .replace(/\d{1,2}:\d{2}/g, padTime),
    );

const parseSlotTitle = (rawTitle) => {
    let title = rawTitle.trim();
    const repeat = /\/\s*повтор\s*\//i.test(title);
    title = title.replace(/\/\s*повтор\s*\//gi, '').trim();

    const ageMatch = title.match(/(?:^|\s)(\d{1,2}\+)\s*$/);
    const age = ageMatch ? ageMatch[1] : null;
    if (ageMatch) {
        title = title.slice(0, ageMatch.index).trim();
    }

    return { title, age, repeat };
};

const isTodayHeading = (title) => {
    const today = new Date()
        .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
        .toLowerCase();
    return title.toLowerCase().startsWith(today);
};

const parseSchedule = (html) => {
    const lines = htmlToLines(html);
    const intro = [];
    const days = [];
    let currentDay = null;
    let slotCount = 0;

    lines.forEach((line) => {
        if (DAY_RE.test(line)) {
            currentDay = {
                title: line,
                isToday: isTodayHeading(line),
                slots: [],
            };
            days.push(currentDay);
            return;
        }

        const slotMatch = line.match(SLOT_RE);
        if (slotMatch) {
            const slot = {
                ranges: formatRanges(slotMatch[1]),
                ...parseSlotTitle(slotMatch[2]),
            };
            slotCount += 1;
            if (!currentDay) {
                currentDay = { title: 'Эфир', isToday: false, slots: [] };
                days.push(currentDay);
            }
            currentDay.slots.push(slot);
            return;
        }

        if (!currentDay) {
            intro.push(line);
        }
    });

    if (!slotCount) return null;
    return { intro, days };
};

const formatProgramHtml = (text = '') => text.replace(/\n/g, '<br>');

const ProgramSchedule = ({ html }) => {
    const schedule = parseSchedule(html);

    if (!schedule) {
        return (
            <div
                className={styles.programContent}
                dangerouslySetInnerHTML={{
                    __html: formatProgramHtml(html),
                }}
            />
        );
    }

    return (
        <div className={styles.schedule}>
            {schedule.intro.length > 0 && (
                <div className={styles.weekIntro}>
                    {schedule.intro.map((line) => (
                        <p key={line}>{line}</p>
                    ))}
                </div>
            )}
            {schedule.days.map((day) => (
                <section
                    key={day.title}
                    className={`${styles.day} ${
                        day.isToday ? styles.dayToday : ''
                    }`}
                >
                    <header className={styles.dayHeader}>
                        <h3>{day.title}</h3>
                        {day.isToday && (
                            <span className={styles.todayBadge}>Сегодня</span>
                        )}
                    </header>
                    <ul className={styles.slotList}>
                        {day.slots.map((slot) => (
                            <li
                                key={`${day.title}-${slot.ranges.join('-')}-${slot.title}`}
                                className={styles.slot}
                            >
                                <div className={styles.times}>
                                    {slot.ranges.map((range) => (
                                        <span key={range} className={styles.timeChip}>
                                            {range}
                                        </span>
                                    ))}
                                </div>
                                <div className={styles.slotBody}>
                                    <p className={styles.slotTitle}>{slot.title}</p>
                                    <div className={styles.slotBadges}>
                                        {slot.repeat && (
                                            <span className={styles.repeatBadge}>
                                                Повтор
                                            </span>
                                        )}
                                        {slot.age && (
                                            <span className={styles.ageBadge}>
                                                {slot.age}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
};

export const TvProgramList = () => {
    const dispatch = useDispatch();
    const tvPrograms = useSelector(selectAllTvPrograms);
    const status = useSelector(selectTvProgramStatus);
    const [showArchive, setShowArchive] = useState(false);

    useEffect(() => {
        dispatch(fetchAllTvPrograms());
    }, [dispatch]);

    const latestProgram =
        tvPrograms.length > 0 ? tvPrograms[tvPrograms.length - 1] : null;
    const archivePrograms =
        tvPrograms.length > 1 ? tvPrograms.slice(0, -1).reverse() : [];
    const publishedAt = formatDate(
        latestProgram?.updatedAt || latestProgram?.createdAt,
    );

    if (status === 'loading' && tvPrograms.length === 0) {
        return (
            <div className={styles.loaderWrap}>
                <Loader />
            </div>
        );
    }

    return (
        <section className={styles.tvProgramList}>
            <header className={styles.pageHeader}>
                <span className={styles.eyebrow}>ГТРК «Ингушетия»</span>
                <h1 className={styles.title}>Текущая программа</h1>
                <p className={styles.subtitle}>
                    Расписание эфира телеканала на ближайшее время
                </p>
            </header>

            {latestProgram ? (
                <article className={styles.currentCard}>
                    <div className={styles.currentMeta}>
                        <span className={styles.liveBadge}>
                            <span className={styles.liveDot} aria-hidden />
                            Актуальная программа
                        </span>
                        {publishedAt && (
                            <time className={styles.publishedAt}>
                                Обновлено {publishedAt}
                            </time>
                        )}
                    </div>
                    <ProgramSchedule html={latestProgram.program} />
                </article>
            ) : (
                <div className={styles.emptyState}>
                    <p className={styles.emptyTitle}>Программа пока не опубликована</p>
                    <p className={styles.emptyText}>
                        Расписание эфира появится здесь, как только его добавят
                    </p>
                </div>
            )}

            {archivePrograms.length > 0 && (
                <div className={styles.archiveBlock}>
                    <button
                        type="button"
                        className={styles.archiveButton}
                        onClick={() => setShowArchive((prev) => !prev)}
                        aria-expanded={showArchive}
                    >
                        <span>
                            {showArchive
                                ? 'Скрыть архив'
                                : 'Архивные расписания'}
                        </span>
                        <span className={styles.archiveCount}>
                            {archivePrograms.length}
                        </span>
                        <span
                            className={`${styles.archiveChevron} ${
                                showArchive ? styles.archiveChevronOpen : ''
                            }`}
                            aria-hidden
                        />
                    </button>

                    {showArchive && (
                        <div className={styles.archiveList}>
                            {archivePrograms.map((program, index) => {
                                const archiveDate = formatDate(
                                    program.updatedAt || program.createdAt,
                                );
                                return (
                                    <article
                                        key={program.id}
                                        className={styles.archiveCard}
                                        style={{
                                            animationDelay: `${Math.min(index, 8) * 0.04}s`,
                                        }}
                                    >
                                        <div className={styles.archiveMeta}>
                                            <span className={styles.archiveLabel}>
                                                Архив
                                            </span>
                                            {archiveDate && (
                                                <time>{archiveDate}</time>
                                            )}
                                        </div>
                                        <ProgramSchedule html={program.program} />
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
