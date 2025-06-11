
export class MoscowTimeUtils {
    static MOSCOW_OFFSET = 3; // UTC+3

    static toMoscowTimeForServer(localDateTime) {
        if (!localDateTime) return null;

        const localDate = new Date(localDateTime);

        const browserOffsetMinutes = localDate.getTimezoneOffset();

        const moscowOffsetMinutes = -this.MOSCOW_OFFSET * 60;

        const diffMinutes = moscowOffsetMinutes - (-browserOffsetMinutes);

        const moscowDate = new Date(localDate.getTime() + (diffMinutes * 60 * 1000));

        console.log('🕐 Конвертация времени:');
        console.log(`   Локальное время: ${localDate.toLocaleString()}`);
        console.log(`   Московское время: ${moscowDate.toLocaleString()}`);
        console.log(`   UTC для сервера: ${moscowDate.toISOString()}`);

        return moscowDate.toISOString();
    }

    static fromServerToLocal(serverDateTime) {
        if (!serverDateTime) return '';

        const utcDate = new Date(serverDateTime);

        const localISOString = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000))
            .toISOString()
            .slice(0, 16);

        return localISOString;
    }

    static formatMoscowTime(dateString, options = {}) {
        if (!dateString) return '';

        const defaultOptions = {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            ...options
        };

        return new Date(dateString).toLocaleString('ru-RU', defaultOptions);
    }

    static getMinMoscowDateTime() {
        const now = new Date();
        // Добавляем 5 минут к текущему времени
        now.setMinutes(now.getMinutes() + 5);

        const moscowTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));

        return moscowTime.toISOString().slice(0, 16);
    }

    static isFutureDate(dateString) {
        if (!dateString) return false;

        const inputDate = new Date(dateString);
        const nowInMoscow = new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Moscow"}));

        return inputDate > nowInMoscow;
    }
}

