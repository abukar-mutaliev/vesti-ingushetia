require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        // Отключаем логирование SQL запросов (слишком много шума)
        // Для отладки можно временно включить: logging: console.log
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 60000, // Увеличено для лучшей стабильности
            idle: 20000,
            evict: 10000,
        },
        retry: {
            max: 3, // Количество попыток переподключения
            backoffBase: 100, // Базовая задержка в мс
            backoffExponent: 1.5, // Экспонента для увеличения задержки
        },
        dialectOptions: {
            connectTimeout: 60000, // Таймаут подключения 60 секунд
            statement_timeout: 60000, // Таймаут выполнения запроса
            idle_in_transaction_session_timeout: 60000,
        },
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 20, // Увеличено для продакшена
            min: 5,  // Минимум соединений
            acquire: 60000,
            idle: 30000,
            evict: 10000,
        },
        retry: {
            max: 5, // Больше попыток для продакшена
            backoffBase: 100,
            backoffExponent: 1.5,
        },
        dialectOptions: {
            connectTimeout: 60000,
            statement_timeout: 60000,
            idle_in_transaction_session_timeout: 60000,
            // SSL настройки для продакшена
            ssl: process.env.DB_SSL === 'true' ? {
                require: true,
                rejectUnauthorized: false
            } : false,
        },
    },
};
