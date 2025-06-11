
export class MoscowTimeUtils {
    static MOSCOW_TIMEZONE = 'Europe/Moscow';
    static MOSCOW_OFFSET_HOURS = 3; // UTC+3

    /**
     * ИСПРАВЛЕНО: Преобразует datetime-local в правильное время для сервера
     * @param {string} localDateTime - строка из input datetime-local
     * @returns {string} ISO строка для сервера
     */
    static toServerTime(localDateTime) {
        if (!localDateTime) return null;

        console.log('🕐 [CLIENT] Конвертация времени для сервера:');
        console.log(`   Введенное время: ${localDateTime}`);

        try {
            // Если это datetime-local формат, добавляем секунды если их нет
            let normalizedDateTime = localDateTime;
            if (localDateTime.includes('T') && !localDateTime.includes(':00', localDateTime.lastIndexOf(':'))) {
                if (localDateTime.split('T')[1].split(':').length === 2) {
                    normalizedDateTime += ':00';
                }
            }

            // Интерпретируем введенное время как московское
            const moscowTime = new Date(normalizedDateTime + '+03:00');

            if (isNaN(moscowTime.getTime())) {
                throw new Error('Неверный формат времени');
            }

            const utcTime = moscowTime.toISOString();

            console.log(`   Московское время: ${this.formatMoscowTime(moscowTime)}`);
            console.log(`   UTC для сервера: ${utcTime}`);

            return utcTime;
        } catch (error) {
            console.error('Ошибка конвертации времени:', error);
            return null;
        }
    }

    /**
     * ИСПРАВЛЕНО: Преобразует UTC время с сервера для datetime-local input
     * @param {string} serverDateTime - UTC время с сервера
     * @returns {string} строка для input datetime-local
     */
    static fromServerTime(serverDateTime) {
        if (!serverDateTime) return '';

        console.log('🕐 [CLIENT] Конвертация времени с сервера:');
        console.log(`   UTC с сервера: ${serverDateTime}`);

        try {
            const utcDate = new Date(serverDateTime);

            if (isNaN(utcDate.getTime())) {
                throw new Error('Неверный формат даты с сервера');
            }

            // Получаем московское время
            const moscowTime = new Date(utcDate.toLocaleString("en-US", {timeZone: this.MOSCOW_TIMEZONE}));

            // Форматируем для datetime-local input
            const year = moscowTime.getFullYear();
            const month = String(moscowTime.getMonth() + 1).padStart(2, '0');
            const day = String(moscowTime.getDate()).padStart(2, '0');
            const hours = String(moscowTime.getHours()).padStart(2, '0');
            const minutes = String(moscowTime.getMinutes()).padStart(2, '0');

            const localString = `${year}-${month}-${day}T${hours}:${minutes}`;

            console.log(`   Московское время: ${this.formatMoscowTime(utcDate)}`);
            console.log(`   Для input: ${localString}`);

            return localString;
        } catch (error) {
            console.error('Ошибка конвертации времени с сервера:', error);
            return '';
        }
    }

    /**
     * Форматирует дату для отображения в московском времени
     * @param {string|Date} dateString - дата для форматирования
     * @param {object} options - опции форматирования
     * @returns {string} отформатированная дата
     */
    static formatMoscowTime(dateString, options = {}) {
        if (!dateString) return '';

        try {
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
        } catch (error) {
            console.error('Ошибка форматирования времени:', error);
            return 'Неверная дата';
        }
    }

    /**
     * ИСПРАВЛЕНО: Получает минимальное время для datetime-local (текущее московское + 5 минут)
     * @returns {string} минимальное время для input
     */
    static getMinDateTime() {
        try {
            const now = new Date();
            // Получаем текущее московское время
            const moscowNow = new Date(now.toLocaleString("en-US", {timeZone: this.MOSCOW_TIMEZONE}));

            // Добавляем 5 минут
            moscowNow.setMinutes(moscowNow.getMinutes() + 5);

            // Форматируем для datetime-local
            const year = moscowNow.getFullYear();
            const month = String(moscowNow.getMonth() + 1).padStart(2, '0');
            const day = String(moscowNow.getDate()).padStart(2, '0');
            const hours = String(moscowNow.getHours()).padStart(2, '0');
            const minutes = String(moscowNow.getMinutes()).padStart(2, '0');

            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (error) {
            console.error('Ошибка получения минимального времени:', error);
            // Fallback
            const now = new Date();
            now.setMinutes(now.getMinutes() + 5);
            return now.toISOString().slice(0, 16);
        }
    }

    /**
     * Проверяет что дата в будущем (в московском времени)
     * @param {string} dateString - дата для проверки
     * @returns {boolean} true если дата в будущем
     */
    static isFutureDate(dateString) {
        if (!dateString) return false;

        try {
            const inputDate = new Date(dateString + '+03:00'); // Считаем как московское время
            const nowMoscow = new Date(new Date().toLocaleString("en-US", {timeZone: this.MOSCOW_TIMEZONE}));

            return inputDate > nowMoscow;
        } catch (error) {
            return false;
        }
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
     * @param {string|Date} dateString - дата для форматирования
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
     * @param {string|Date} dateString - дата для форматирования
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
     * ИСПРАВЛЕНО: Проверяет валидность введенной даты планирования
     * @param {string} dateString - дата для проверки
     * @returns {object} результат валидации
     */
    static validateScheduleDate(dateString) {
        if (!dateString) {
            return { valid: false, error: 'Дата не указана' };
        }

        try {
            // Интерпретируем как московское время
            const moscowDate = new Date(dateString + '+03:00');

            if (isNaN(moscowDate.getTime())) {
                return { valid: false, error: 'Неверный формат даты' };
            }

            const nowMoscow = new Date(new Date().toLocaleString("en-US", {timeZone: this.MOSCOW_TIMEZONE}));
            const minFutureTime = new Date(nowMoscow.getTime() + 60 * 1000); // +1 минута

            if (moscowDate <= minFutureTime) {
                return {
                    valid: false,
                    error: 'Дата должна быть как минимум на 1 минуту в будущем',
                    current: this.formatMoscowTime(nowMoscow),
                    entered: this.formatMoscowTime(moscowDate)
                };
            }

            const maxFutureTime = new Date(nowMoscow.getTime() + 365 * 24 * 60 * 60 * 1000); // +1 год
            if (moscowDate > maxFutureTime) {
                return {
                    valid: false,
                    error: 'Дата не может быть более чем через год'
                };
            }

            return {
                valid: true,
                moscowTime: this.formatMoscowTime(moscowDate)
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
     * @param {string|Date} dateString - дата
     * @returns {string} относительное время
     */
    static getRelativeTime(dateString) {
        if (!dateString) return '';

        try {
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
        } catch (error) {
            return 'неизвестно';
        }
    }

    /**
     * НОВЫЙ: Проверяет корректность времени между клиентом и сервером
     * @param {string} clientTime - время с клиента
     * @param {string} serverTime - время с сервера
     * @returns {object} информация о синхронизации
     */
    static checkTimeSync(clientTime, serverTime) {
        try {
            const client = new Date(clientTime);
            const server = new Date(serverTime);

            const diffMs = Math.abs(client.getTime() - server.getTime());
            const diffMinutes = Math.floor(diffMs / (1000 * 60));

            return {
                inSync: diffMinutes < 2, // Считаем синхронизированным если разница < 2 минут
                difference: diffMinutes,
                clientMoscow: this.formatMoscowTime(client),
                serverMoscow: this.formatMoscowTime(server)
            };
        } catch (error) {
            return {
                inSync: false,
                error: error.message
            };
        }
    }

    /**
     * НОВЫЙ: Отладочная информация о времени
     * @param {string} label - метка для отладки
     * @param {string|Date} date - дата для анализа
     * @returns {object} отладочная информация
     */
    static debugTime(label, date = new Date()) {
        const dateObj = new Date(date);

        const info = {
            label,
            input: date,
            utc: dateObj.toISOString(),
            moscow: this.formatMoscowTime(dateObj),
            local: dateObj.toString(),
            timestamp: dateObj.getTime(),
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            userOffset: dateObj.getTimezoneOffset()
        };

        console.group(`🕐 ${label}`);
        console.table(info);
        console.groupEnd();

        return info;
    }
}

export default MoscowTimeUtils;

// Экспортируем наиболее используемые методы
export const formatMoscowTime = MoscowTimeUtils.formatMoscowTime.bind(MoscowTimeUtils);
export const toServerTime = MoscowTimeUtils.toServerTime.bind(MoscowTimeUtils);
export const fromServerTime = MoscowTimeUtils.fromServerTime.bind(MoscowTimeUtils);
export const validateScheduleDate = MoscowTimeUtils.validateScheduleDate.bind(MoscowTimeUtils);
export const getMinDateTime = MoscowTimeUtils.getMinDateTime.bind(MoscowTimeUtils);
export const debugTime = MoscowTimeUtils.debugTime.bind(MoscowTimeUtils);