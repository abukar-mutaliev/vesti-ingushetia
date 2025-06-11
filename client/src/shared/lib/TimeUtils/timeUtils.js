// src/shared/lib/timeUtils.js

export class MoscowTimeUtils {
    static MOSCOW_TIMEZONE = 'Europe/Moscow';
    static MOSCOW_OFFSET_HOURS = 3; // UTC+3

    /**
     * Преобразует datetime-local в UTC время для отправки на сервер
     * @param {string} localDateTime - строка из input datetime-local
     * @returns {string} ISO строка в UTC для сервера
     */
    static toServerTime(localDateTime) {
        if (!localDateTime) return null;

        console.log('🕐 [CLIENT] Конвертация времени для сервера:');
        console.log(`   Введенное время: ${localDateTime}`);

        // Создаём дату из локального ввода
        const inputDate = new Date(localDateTime);
        console.log(`   Интерпретированная дата: ${inputDate.toString()}`);

        // Получаем смещение браузера в минутах (отрицательное для положительных часовых поясов)
        const browserOffsetMinutes = inputDate.getTimezoneOffset();
        console.log(`   Смещение браузера: ${browserOffsetMinutes} минут`);

        // Московское смещение: UTC+3 = -180 минут
        const moscowOffsetMinutes = -3 * 60;

        // Вычисляем разность между московским временем и временем браузера
        const offsetDifference = moscowOffsetMinutes - (-browserOffsetMinutes);
        console.log(`   Разница смещений: ${offsetDifference} минут`);

        // Корректируем время
        const correctedDate = new Date(inputDate.getTime() + (offsetDifference * 60 * 1000));
        const isoString = correctedDate.toISOString();

        console.log(`   Время для сервера (UTC): ${isoString}`);
        console.log(`   Московское время: ${this.formatMoscowTime(correctedDate)}`);

        return isoString;
    }

    /**
     * Преобразует UTC время с сервера в локальное время для input datetime-local
     * @param {string} serverDateTime - UTC время с сервера
     * @returns {string} строка для input datetime-local
     */
    static fromServerTime(serverDateTime) {
        if (!serverDateTime) return '';

        console.log('🕐 [CLIENT] Конвертация времени с сервера:');
        console.log(`   Время с сервера (UTC): ${serverDateTime}`);

        // Создаём дату из UTC времени
        const utcDate = new Date(serverDateTime);

        // Преобразуем в местное время браузера для input datetime-local
        const localISOString = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000))
            .toISOString()
            .slice(0, 16);

        console.log(`   Для input datetime-local: ${localISOString}`);
        console.log(`   Московское время: ${this.formatMoscowTime(utcDate)}`);

        return localISOString;
    }

    /**
     * Форматирует дату для отображения в московском времени
     * @param {string|Date} dateString - дата для форматирования
     * @param {object} options - опции форматирования
     * @returns {string} отформатированная дата
     */
    static formatMoscowTime(dateString, options = {}) {
        if (!dateString) return '';

        const defaultOptions = {
            timeZone: this.MOSCOW_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            ...options
        };

        return new Date(dateString).toLocaleString('ru-RU', defaultOptions);
    }

    /**
     * Получает минимальное время для input datetime-local (текущее + 5 минут в московском времени)
     * @returns {string} минимальное время для input
     */
    static getMinDateTime() {
        const now = new Date();
        // Добавляем 5 минут к текущему времени
        now.setMinutes(now.getMinutes() + 5);

        // Получаем московское время
        const moscowTime = new Date(now.toLocaleString("en-US", {timeZone: this.MOSCOW_TIMEZONE}));

        // Преобразуем в формат для input datetime-local
        return moscowTime.toISOString().slice(0, 16);
    }

    /**
     * Проверяет что дата в будущем (московское время)
     * @param {string} dateString - дата для проверки
     * @returns {boolean} true если дата в будущем
     */
    static isFutureDate(dateString) {
        if (!dateString) return false;

        const inputDate = new Date(dateString);
        const nowInMoscow = new Date(new Date().toLocaleString("en-US", {timeZone: this.MOSCOW_TIMEZONE}));

        return inputDate > nowInMoscow;
    }

    /**
     * Получает текущее московское время для отображения
     * @returns {string} текущее московское время
     */
    static now() {
        return this.formatMoscowTime(new Date());
    }

    /**
     * Форматирует дату для краткого отображения
     * @param {string} dateString - дата для форматирования
     * @returns {string} краткая дата
     */
    static formatShort(dateString) {
        return this.formatMoscowTime(dateString, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Форматирует дату для полного отображения
     * @param {string} dateString - дата для форматирования
     * @returns {string} полная дата
     */
    static formatFull(dateString) {
        return this.formatMoscowTime(dateString, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Проверяет валидность введенной даты планирования
     * @param {string} dateString - дата для проверки
     * @returns {object} результат валидации
     */
    static validateScheduleDate(dateString) {
        if (!dateString) {
            return { valid: false, error: 'Дата не указана' };
        }

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return { valid: false, error: 'Неверный формат даты' };
            }

            const now = new Date();
            const minFutureTime = new Date(now.getTime() + 60 * 1000); // +1 минута

            if (date <= minFutureTime) {
                return {
                    valid: false,
                    error: 'Дата должна быть как минимум на 1 минуту в будущем',
                    current: this.formatMoscowTime(now),
                    entered: this.formatMoscowTime(date)
                };
            }

            const maxFutureTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // +1 год
            if (date > maxFutureTime) {
                return {
                    valid: false,
                    error: 'Дата не может быть более чем через год'
                };
            }

            return {
                valid: true,
                moscowTime: this.formatMoscowTime(date)
            };
        } catch (error) {
            return {
                valid: false,
                error: `Ошибка: ${error.message}`
            };
        }
    }

    /**
     * Получает относительное время (например, "2 часа назад")
     * @param {string} dateString - дата
     * @returns {string} относительное время
     */
    static getRelativeTime(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'только что';
        if (diffMinutes < 60) return `${diffMinutes} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        if (diffDays < 7) return `${diffDays} дн назад`;

        return this.formatMoscowTime(dateString, {
            month: 'short',
            day: 'numeric'
        });
    }
}

export default MoscowTimeUtils;

export const formatMoscowTime = MoscowTimeUtils.formatMoscowTime.bind(MoscowTimeUtils);
export const toServerTime = MoscowTimeUtils.toServerTime.bind(MoscowTimeUtils);
export const fromServerTime = MoscowTimeUtils.fromServerTime.bind(MoscowTimeUtils);