import { useState } from 'react';
import PropTypes from 'prop-types';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from './CustomCalendar.module.scss';

export const CustomCalendar = ({
    onDateChange,
    newsDates,
    title,
    onReset,
    resetLabel = 'Показать все новости',
}) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleDateClick = (date) => {
        setSelectedDate(date);
        onDateChange(date);
    };

    const isDateDisabled = ({ date, view }) => {
        if (view === 'month') {
            return !newsDates.includes(date.toDateString());
        }
        return false;
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month' && newsDates.includes(date.toDateString())) {
            return <span className={styles.newsDot} />;
        }
        return null;
    };

    return (
        <div className={styles.card}>
            {title && (
                <header className={styles.header}>
                    <span className={styles.eyebrow}>Архив</span>
                    <h2 className={styles.title}>{title}</h2>
                </header>
            )}
            <Calendar
                locale="ru-RU"
                onChange={handleDateClick}
                value={selectedDate}
                tileDisabled={isDateDisabled}
                tileContent={tileContent}
                className={styles.calendar}
                prev2Label="«"
                next2Label="»"
                prevLabel="‹"
                nextLabel="›"
            />
            {onReset && (
                <button
                    type="button"
                    className={styles.resetButton}
                    onClick={onReset}
                >
                    {resetLabel}
                </button>
            )}
        </div>
    );
};

CustomCalendar.propTypes = {
    onDateChange: PropTypes.func.isRequired,
    newsDates: PropTypes.arrayOf(PropTypes.string).isRequired,
    title: PropTypes.string,
    onReset: PropTypes.func,
    resetLabel: PropTypes.string,
};
