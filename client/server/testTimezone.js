// testTimezone.js - поместите в корень server/
// Запуск: node testTimezone.js

require('dotenv').config();

// Устанавливаем временную зону
process.env.TZ = 'Europe/Moscow';

const MoscowTimeUtils = require('./utils/moscowTimeUtils');

console.log('🔍 Тестирование временных зон для новостного сайта\n');

// 1. Проверка системных настроек
console.log('📊 Системные настройки:');
console.log(`   process.env.TZ: ${process.env.TZ}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   Intl.DateTimeFormat().resolvedOptions().timeZone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

// 2. Текущее время
console.log('\n🕐 Текущее время:');
const now = new Date();
console.log(`   UTC: ${now.toISOString()}`);
console.log(`   Local: ${now.toString()}`);
console.log(`   Moscow: ${MoscowTimeUtils.formatMoscowTime(now)}`);

// 3. Проверка смещения
console.log('\n⏰ Проверка смещения:');
const moscowOffset = 3; // UTC+3
const localOffset = -now.getTimezoneOffset() / 60;
console.log(`   Местное смещение: UTC${localOffset >= 0 ? '+' : ''}${localOffset}`);
console.log(`   Московское смещение: UTC+${moscowOffset}`);
console.log(`   Разница: ${Math.abs(localOffset - moscowOffset)} часов`);

// 4. Тест планирования новости
console.log('\n📅 Тест планирования новости:');

// Тест 1: Будущая дата (через 2 часа)
const futureDate = new Date();
futureDate.setHours(futureDate.getHours() + 2);

console.log('\n   Тест 1: Новость через 2 часа');
console.log(`   Дата: ${futureDate.toISOString()}`);
console.log(`   Москва: ${MoscowTimeUtils.formatMoscowTime(futureDate)}`);

const validation1 = MoscowTimeUtils.validateScheduleDate(futureDate.toISOString());
console.log(`   Валидация: ${validation1.valid ? '✅ Прошла' : '❌ Не прошла'}`);
if (!validation1.valid) console.log(`   Ошибка: ${validation1.error}`);

// Тест 2: Прошедшая дата
const pastDate = new Date();
pastDate.setHours(pastDate.getHours() - 1);

console.log('\n   Тест 2: Новость в прошлом (час назад)');
console.log(`   Дата: ${pastDate.toISOString()}`);
console.log(`   Москва: ${MoscowTimeUtils.formatMoscowTime(pastDate)}`);

const validation2 = MoscowTimeUtils.validateScheduleDate(pastDate.toISOString());
console.log(`   Валидация: ${validation2.valid ? '✅ Прошла' : '❌ Не прошла'}`);
if (!validation2.valid) console.log(`   Ошибка: ${validation2.error}`);

// Тест 3: Дата на грани (через 30 секунд)
const borderDate = new Date();
borderDate.setSeconds(borderDate.getSeconds() + 30);

console.log('\n   Тест 3: Новость через 30 секунд');
console.log(`   Дата: ${borderDate.toISOString()}`);
console.log(`   Москва: ${MoscowTimeUtils.formatMoscowTime(borderDate)}`);

const validation3 = MoscowTimeUtils.validateScheduleDate(borderDate.toISOString());
console.log(`   Валидация: ${validation3.valid ? '✅ Прошла' : '❌ Не прошла'}`);
if (!validation3.valid) console.log(`   Ошибка: ${validation3.error}`);

// 5. Эмуляция фронтенда
console.log('\n💻 Эмуляция фронтенда:');

// Имитируем выбор даты пользователем в браузере
const userSelectedTime = '2025-06-11T15:30'; // Пример: пользователь выбрал 15:30
console.log(`   Пользователь выбрал: ${userSelectedTime} (datetime-local)`);

// Эмуляция обработки на фронтенде
const localDate = new Date(userSelectedTime);
console.log(`   Локальная дата JS: ${localDate.toString()}`);
console.log(`   UTC для отправки: ${localDate.toISOString()}`);

// Эмуляция обработки на сервере
const serverReceivedDate = new Date(localDate.toISOString());
console.log(`   Сервер получил UTC: ${serverReceivedDate.toISOString()}`);
console.log(`   Сервер интерпретирует как Москва: ${MoscowTimeUtils.formatMoscowTime(serverReceivedDate)}`);

// 6. Тест сохранения и чтения из БД
console.log('\n💾 Эмуляция работы с БД:');

const scheduleTestDate = new Date();
scheduleTestDate.setHours(scheduleTestDate.getHours() + 3);

console.log('   Планируемая дата:');
MoscowTimeUtils.logTimeComparison('Исходная дата', scheduleTestDate);

// Эмуляция сохранения в БД (как ISO string)
const savedToDb = scheduleTestDate.toISOString();
console.log(`   Сохранено в БД: ${savedToDb}`);

// Эмуляция чтения из БД
const readFromDb = new Date(savedToDb);
console.log('   Прочитано из БД:');
MoscowTimeUtils.logTimeComparison('Восстановленная дата', readFromDb);

// 7. Проверка соответствия
console.log('\n✅ Проверка соответствия:');
const originalMoscow = MoscowTimeUtils.formatMoscowTime(scheduleTestDate);
const restoredMoscow = MoscowTimeUtils.formatMoscowTime(readFromDb);

console.log(`   Исходное московское время: ${originalMoscow}`);
console.log(`   Восстановленное московское время: ${restoredMoscow}`);
console.log(`   Соответствие: ${originalMoscow === restoredMoscow ? '✅ Да' : '❌ Нет'}`);

// 8. Отладочная информация
console.log('\n🔧 Отладочная информация:');
const debugInfo = MoscowTimeUtils.getTimeDebugInfo();
Object.entries(debugInfo).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
});

// 9. Рекомендации
console.log('\n💡 Рекомендации:');
console.log('   1. ✅ Временная зона сервера установлена в Europe/Moscow');
console.log('   2. ✅ Фронтенд должен отправлять время как московское в UTC формате');
console.log('   3. ✅ Сервер интерпретирует полученное время как московское');
console.log('   4. ✅ При отображении всегда используйте MoscowTimeUtils.formatMoscowTime()');
console.log('   5. ✅ Для валидации используйте MoscowTimeUtils.validateScheduleDate()');

console.log('\n🎉 Тест временных зон завершен!');

// Экспорт для использования в других скриптах
module.exports = {
    testBasicTimezone: () => {
        const info = MoscowTimeUtils.getTimeDebugInfo();
        console.log('Базовый тест временной зоны:', info);
        return info;
    },

    testScheduleValidation: (dateString) => {
        const result = MoscowTimeUtils.validateScheduleDate(dateString);
        console.log('Тест валидации планирования:', result);
        return result;
    }
};