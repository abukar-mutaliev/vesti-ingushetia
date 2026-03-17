/**
 * Скрипт восстановления аккаунта администратора
 * Использование: node scripts/reset-admin.js [новый_пароль] [новый_email]
 * Пример: node scripts/reset-admin.js Admin123! admin@local.ru
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const { User, sequelize } = require('../models');

const NEW_PASSWORD = process.argv[2] || 'Admin123!';
const NEW_EMAIL = process.argv[3] || 'admin@local.ru';

async function resetAdmin() {
    try {
        await sequelize.authenticate();
        console.log('✅ Подключение к БД успешно');

        const admin = await User.findOne({
            where: { isAdmin: true },
            attributes: ['id', 'username', 'email', 'isAdmin'],
        });

        if (!admin) {
            console.log('❌ Администратор не найден в БД.');
            console.log('   Создаю нового админа...');
            const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
            const newAdmin = await User.create({
                username: 'admin',
                email: NEW_EMAIL,
                password: hashedPassword,
                isAdmin: true,
            });
            console.log('✅ Создан новый администратор:');
            console.log(`   ID: ${newAdmin.id}`);
            console.log(`   Пользователь: ${newAdmin.username}`);
            console.log(`   Email: ${newAdmin.email}`);
            console.log(`   Пароль: ${NEW_PASSWORD}`);
            process.exit(0);
            return;
        }

        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
        await admin.update({
            password: hashedPassword,
            email: NEW_EMAIL,
        });

        console.log('✅ Пароль и email администратора обновлены:');
        console.log(`   ID: ${admin.id}`);
        console.log(`   Пользователь: ${admin.username}`);
        console.log(`   Email: ${NEW_EMAIL}`);
        console.log(`   Пароль: ${NEW_PASSWORD}`);
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

resetAdmin();
