require('dotenv').config();
const { User } = require('./models');
const bcrypt = require('bcrypt');

async function checkAdmin() {
    try {
        console.log('🔍 Проверка пользователей в базе данных...\n');

        // Получаем всех пользователей
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'isAdmin', 'createdAt']
        });

        console.log(`Найдено пользователей: ${users.length}\n`);

        if (users.length === 0) {
            console.log('❌ Пользователей не найдено. Создаю администратора...\n');

            const adminPassword = 'admin123';
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const admin = await User.create({
                username: 'admin',
                email: 'admin@example.com',
                password: hashedPassword,
                isAdmin: true
            });

            console.log('✅ Администратор успешно создан!');
            console.log(`📧 Email: admin@example.com`);
            console.log(`🔑 Пароль: ${adminPassword}`);
            console.log(`👤 ID: ${admin.id}`);

        } else {
            console.log('📋 Список пользователей:');
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.username} (${user.email}) - ${user.isAdmin ? 'АДМИН' : 'ПОЛЬЗОВАТЕЛЬ'}`);
                if (user.email === 'admin@example.com') {
                    console.log(`   🔑 Пароль для admin@example.com: admin123 (если не изменялся)`);
                }
            });
        }

    } catch (error) {
        console.error('❌ Ошибка:', error.message);

        // Если ошибка подключения к БД, показываем возможные причины
        if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Возможные решения:');
            console.log('1. Проверьте, что PostgreSQL сервер запущен');
            console.log('2. Проверьте переменные окружения в .env файле');
            console.log('3. Создайте .env файл в корне проекта со следующими переменными:');
            console.log('   DB_HOST=localhost');
            console.log('   DB_PORT=5432');
            console.log('   DB_USER=your_db_user');
            console.log('   DB_PASSWORD=your_db_password');
            console.log('   DB_NAME=your_db_name');
        }
    } finally {
        process.exit(0);
    }
}

checkAdmin();
