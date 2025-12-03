const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');

// Настройки подключения из вашего .env файла
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'vesti',
    username: 'postgres',
    password: 'bmw',
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

async function createAdmin() {
    try {
        console.log('🔄 Подключение к базе данных PostgreSQL...');

        // Проверяем подключение
        await sequelize.authenticate();
        console.log('✅ Подключение к базе данных успешно!');

        // Синхронизируем модель
        await User.sync();
        console.log('📋 Модель пользователей синхронизирована');

        // Проверяем, существует ли уже админ
        const existingAdmin = await User.findOne({
            where: { email: 'admin@example.com' }
        });

        if (existingAdmin) {
            console.log('ℹ️ Администратор уже существует!');
            console.log(`   👤 Пользователь: ${existingAdmin.username}`);
            console.log(`   📧 Email: ${existingAdmin.email}`);
            console.log(`   🔑 Пароль: admin123 (если не был изменен)`);
            console.log(`   👑 Админ: ${existingAdmin.isAdmin ? 'Да' : 'Нет'}`);
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
        console.log(`   👑 Админ: ${admin.isAdmin ? 'Да' : 'Нет'}`);
        console.log(`   🆔 ID: ${admin.id}`);

        console.log('\n🎉 Теперь вы можете войти в админ панель!');
        console.log('   📧 Email: admin@example.com');
        console.log('   🔑 Пароль: admin123');

    } catch (error) {
        console.error('❌ Ошибка:', error.message);

        if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Возможные причины ошибки подключения:');
            console.log('1. PostgreSQL сервер не запущен');
            console.log('   ▶️  Запустите: sudo systemctl start postgresql (Linux)');
            console.log('   ▶️  Или через Services (Windows)');
            console.log('');
            console.log('2. База данных "vesti" не существует');
            console.log('   ▶️  Создайте БД: createdb vesti');
            console.log('');
            console.log('3. Неверные учетные данные');
            console.log('   ▶️  Проверьте логин/пароль от PostgreSQL');
            console.log('');
        } else if (error.message.includes('relation "users" does not exist')) {
            console.log('\n💡 Таблица пользователей не существует');
            console.log('   ▶️  Запустите сервер Node.js первый раз для создания таблиц');
            console.log('   ▶️  Команда: cd client && npm start');
            console.log('');
        }
    } finally {
        await sequelize.close();
        console.log('\n🔌 Подключение закрыто');
    }
}

createAdmin();



