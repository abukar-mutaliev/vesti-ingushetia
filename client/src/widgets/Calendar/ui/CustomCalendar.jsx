import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CustomCalendar.css';

export const CustomCalendar = ({ onDateChange, newsDates }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleDateClick = (date) => {
        setSelectedDate(date);
        onDateChange(date);
    };

    const isDateDisabled = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toDateString();
            return !newsDates.includes(dateString);
        }
        return false;
    };
    return (
        <div className="customCalendar">
            <Calendar
                onChange={handleDateClick}
                value={selectedDate}
                tileDisabled={isDateDisabled}
                className="react-calendar"
            />
        </div>
    );
};
