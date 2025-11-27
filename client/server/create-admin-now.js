const bcrypt = require('bcrypt');
const { User } = require('./models');

async function createAdmin() {
    try {
        console.log('🔄 Создание администратора...');

        // Проверяем, существует ли уже админ
        const existingAdmin = await User.findOne({
            where: { email: 'admin@example.com' }
        });

        if (existingAdmin) {
            console.log('ℹ️ Администратор уже существует!');
            console.log(`   👤 Пользователь: ${existingAdmin.username}`);
            console.log(`   📧 Email: ${existingAdmin.email}`);
            console.log(`   🔑 Пароль: admin123 (если не был изменен)`);
            return;
        }

        // Создаем админа
        console.log('👤 Создание нового администратора...');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            isAdmin: true,
        });

        console.log('✅ Администратор успешно создан!');
        console.log('\n🎉 Учетные данные для входа в админ панель:');
        console.log('   📧 Email: admin@example.com');
        console.log('   🔑 Пароль: admin123');

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

createAdmin();
