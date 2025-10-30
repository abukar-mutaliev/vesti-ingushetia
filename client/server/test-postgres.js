const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('=== ДИАГНОСТИКА ПОДКЛЮЧЕНИЯ К POSTGRESQL ===\n');

// Проверяем переменные окружения
console.log('Переменные окружения:');
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '[УСТАНОВЛЕН]' : '[НЕ УСТАНОВЛЕН]'}`);
console.log();

async function testConnection() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionTimeoutMillis: 10000, // 10 секунд таймаут
    });

    try {
        console.log('🔄 Попытка подключения к PostgreSQL...');

        const startTime = Date.now();
        await client.connect();
        const connectTime = Date.now() - startTime;

        console.log(`✅ Подключение успешно! (${connectTime}ms)`);

        // Тестируем простой запрос
        const result = await client.query('SELECT version(), current_database(), current_user');
        console.log('\n📊 Информация о базе данных:');
        console.log(`Версия PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
        console.log(`Текущая база данных: ${result.rows[0].current_database}`);
        console.log(`Текущий пользователь: ${result.rows[0].current_user}`);

        // Проверяем место на диске (если возможно)
        try {
            const diskResult = await client.query(`
                SELECT
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                LIMIT 5
            `);

            console.log('\n📏 Размеры таблиц (топ-5):');
            diskResult.rows.forEach(row => {
                console.log(`${row.tablename}: ${row.size}`);
            });

        } catch (diskError) {
            console.log('⚠️ Не удалось получить информацию о размерах таблиц');
        }

        await client.end();
        console.log('\n✅ Все тесты пройдены успешно!');

    } catch (error) {
        console.log('\n❌ Ошибка подключения:');
        console.log(`Код ошибки: ${error.code}`);
        console.log(`Сообщение: ${error.message}`);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔍 Возможные причины:');
            console.log('1. PostgreSQL сервер не запущен');
            console.log('2. Неверный хост или порт');
            console.log('3. Firewall блокирует соединение');
        } else if (error.code === '42P01') {
            console.log('\n🔍 Возможные причины:');
            console.log('1. База данных не существует');
            console.log('2. Неверное имя базы данных');
        } else if (error.code === '28P01') {
            console.log('\n🔍 Возможные причины:');
            console.log('1. Неверные учетные данные');
            console.log('2. Пользователь не существует');
        } else if (error.message.includes('could not write init file')) {
            console.log('\n🔍 Возможные причины ошибки "could not write init file":');
            console.log('1. Недостаточно места на диске сервера PostgreSQL');
            console.log('2. Отсутствуют права записи в директорию данных PostgreSQL');
            console.log('3. Повреждение файловой системы');
            console.log('4. Проблемы с SELinux/AppArmor');
        }

        // Проверяем доступность хоста
        const { exec } = require('child_process');
        exec(`ping -c 3 ${process.env.DB_HOST}`, (pingError, stdout, stderr) => {
            if (pingError) {
                console.log('\n❌ Хост недоступен по ping');
            } else {
                console.log('\n✅ Хост доступен по ping');
            }

            console.log('\n🔧 Рекомендации по устранению:');
            console.log('1. Проверьте, что PostgreSQL сервер запущен: sudo systemctl status postgresql');
            console.log('2. Проверьте логи PostgreSQL: sudo tail -f /var/log/postgresql/postgresql-*.log');
            console.log('3. Проверьте место на диске: df -h');
            console.log('4. Проверьте права доступа к директории данных PostgreSQL');
            console.log('5. Убедитесь, что пользователь PostgreSQL имеет правильные права');
        });

    }
}

testConnection();
