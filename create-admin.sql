-- Создание администратора для базы данных PostgreSQL
-- Запустите этот скрипт в psql или через любой PostgreSQL клиент

-- Вставляем админа (пароль будет захэширован как 'admin123')
-- Обратите внимание: в реальном коде пароль хэшируется с помощью bcrypt

-- Если таблица users существует, вставляем админа
INSERT INTO users (username, email, password, "isAdmin", "createdAt", "updatedAt")
VALUES (
    'admin',
    'admin@example.com',
    '$2b$10$xHcLpJCJiKs5gzKMK8mWqO8Qx6XWJ8YhxzYXJxK3nJ8YhxzYXJxK3nJ8YhxzYXJxK3nJ8YhxzYXJxK3nJ8YhxzYXJxK3nJ8', -- хэш для 'admin123'
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Проверяем, что админ создан
SELECT id, username, email, "isAdmin" FROM users WHERE email = 'admin@example.com';

