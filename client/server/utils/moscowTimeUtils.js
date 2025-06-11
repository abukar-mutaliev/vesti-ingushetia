// utils/moscowTimeUtils.js

class MoscowTimeUtils {
    static MOSCOW_TIMEZONE = 'Europe/Moscow';
    static MOSCOW_OFFSET_HOURS = 3; // UTC+3

    /**
     * Получить текущее время
     */
    static now() {
        return new Date();
    }

    /**
     * Получить текущее московское время в виде строки
     */
    static nowMoscow() {
        return new Date().toLocaleString('ru-RU', {
            timeZone: this.MOSCOW_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Форматировать дату в московском времени
     */
    static formatMoscowTime(date, options = {}) {
        if (!date) return 'не указано';

        const defaultOptions = {
            timeZone: this.MOSCOW_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            ...options
        };

        return new Date(date).toLocaleString('ru-RU', defaultOptions);
    }

    /**
     * Парсить строку даты в объект Date
     */
    static parseDateTime(dateTimeString) {
        if (!dateTimeString) return null;

        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
            throw new Error('Неверный формат даты');
        }

        return date;
    }

    /**
     * Проверить что дата в будущем
     */
    static isValidFutureDate(dateTimeString) {
        try {
            const date = this.parseDateTime(dateTimeString);
            const now = new Date();
            return date && date > now;
        } catch {
            return false;
        }
    }

    /**
     * Логировать сравнение времени
     */
    static logTimeComparison(label, date) {
        const moscowTime = this.formatMoscowTime(date);
        const utcTime = new Date(date).toISOString();

        console.log(`🕐 ${label}:`);
        console.log(`   UTC: ${utcTime}`);
        console.log(`   Москва: ${moscowTime}`);

        return { utcTime, moscowTime };
    }

    /**
     * Получить подробную информацию о времени для отладки
     */
    static getTimeDebugInfo(date = new Date()) {
        const utcTime = date.toISOString();
        const moscowTime = this.formatMoscowTime(date);
        const localTime = date.toString();
        const timestamp = date.getTime();
        const offsetMinutes = date.getTimezoneOffset();

        return {
            utcTime,
            moscowTime,
            localTime,
            timestamp,
            offsetMinutes,
            offsetHours: offsetMinutes / 60,
            timezone: process.env.TZ
        };
    }

    /**
     * Валидировать дату планирования
     */
    static validateScheduleDate(dateString) {
        if (!dateString) {
            return { valid: false, error: 'Дата не указана' };
        }

        try {
            const date = this.parseDateTime(dateString);
            const now = new Date();

            // Проверяем что дата в будущем (минимум 1 минута)
            const minFutureTime = new Date(now.getTime() + 60 * 1000); // +1 минута
            if (date <= minFutureTime) {
                return {
                    valid: false,
                    error: 'Дата должна быть как минимум на 1 минуту в будущем',
                    received: this.formatMoscowTime(date),
                    current: this.formatMoscowTime(now)
                };
            }

            // Проверяем что дата не слишком далеко в будущем (максимум 1 год)
            const maxFutureTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // +1 год
            if (date > maxFutureTime) {
                return {
                    valid: false,
                    error: 'Дата не может быть более чем через год',
                    received: this.formatMoscowTime(date),
                    maxAllowed: this.formatMoscowTime(maxFutureTime)
                };
            }

            return {
                valid: true,
                date,
                moscowTime: this.formatMoscowTime(date),
                utcTime: date.toISOString()
            };
        } catch (error) {
            return {
                valid: false,
                error: `Ошибка парсинга даты: ${error.message}`
            };
        }
    }

    /**
     * Преобразовать UTC время в московское для отображения
     */
    static utcToMoscowDisplay(utcDateString) {
        if (!utcDateString) return '';

        try {
            const date = new Date(utcDateString);
            return this.formatMoscowTime(date);
        } catch {
            return 'Неверный формат даты';
        }
    }

    /**
     * Получить московское время для логов
     */
    static getLogTimestamp() {
        return `[${this.nowMoscow()}]`;
    }
}

module.exports = MoscowTimeUtils;