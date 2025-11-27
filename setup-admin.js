const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Настройка подключения к БД
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
});

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    tableName: 'users',
    timestamps: true,
});

async function setupAdmin() {
    try {
        console.log('🔄 Подключение к базе данных...');

        // Проверяем подключение
        await sequelize.authenticate();
        console.log('✅ Подключение успешно!');

        // Синхронизируем модель (на случай, если таблица не существует)
        await User.sync();
        console.log('📋 Модель синхронизирована');

        // Проверяем, существует ли уже админ
        const existingAdmin = await User.findOne({
            where: { email: 'admin@example.com' }
        });

        if (existingAdmin) {
            console.log('ℹ️ Администратор уже существует:');
            console.log(`   👤 Пользователь: ${existingAdmin.username}`);
            console.log(`   📧 Email: ${existingAdmin.email}`);
            console.log(`   🔑 Пароль: admin123 (если не был изменен)`);
            return;
        }

        // Создаем админа
        console.log('👤 Создание администратора...');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            isAdmin: true,
        });

        console.log('✅ Администратор успешно создан!');
        console.log(`   👤 Пользователь: ${admin.username}`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   🔑 Пароль: admin123`);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);

        if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Возможные решения:');
            console.log('1. Убедитесь, что PostgreSQL сервер запущен');
            console.log('2. Проверьте настройки подключения в файле .env');
            console.log('3. Создайте файл .env в корне проекта:');
            console.log('');
            console.log('   DB_HOST=localhost');
            console.log('   DB_PORT=5432');
            console.log('   DB_USER=ваш_пользователь_postgres');
            console.log('   DB_PASSWORD=ваш_пароль_postgres');
            console.log('   DB_NAME=vesti_ingushetia');
            console.log('');
        }
    } finally {
        await sequelize.close();
    }
}

setupAdmin();
