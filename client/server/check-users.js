require('dotenv').config();
const { sequelize, User, Category } = require('./models');
const logger = require('./logger');

async function checkUsers() {
    try {
        await sequelize.authenticate();
        logger.info('✅ Подключение к базе данных успешно');

        // Проверяем пользователей (без поля role, которого нет)
        const users = await User.findAll({
            attributes: ['id', 'username'],
            limit: 10
        });

        logger.info(`👥 Найдено пользователей: ${users.length}`);
        users.forEach(user => {
            logger.info(`   - ID: ${user.id}, Имя: ${user.username}`);
        });

        // Проверяем категории
        const categories = await Category.findAll({
            attributes: ['id', 'name'],
            limit: 10
        });

        logger.info(`📂 Найдено категорий: ${categories.length}`);
        categories.forEach(category => {
            logger.info(`   - ID: ${category.id}, Название: ${category.name}`);
        });

        if (users.length > 0 && categories.length > 0) {
            logger.info(`\n🎯 Для тестирования используйте:`);
            logger.info(`   - authorId: ${users[0].id} (${users[0].username})`);
            logger.info(`   - categoryId: ${categories[0].id} (${categories[0].name})`);
        }

        // Также проверим структуру таблицы User
        const [results] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);
        
        logger.info(`\n📋 Структура таблицы users:`);
        results.forEach(col => {
            logger.info(`   - ${col.column_name}: ${col.data_type}`);
        });

    } catch (error) {
        logger.error('❌ Ошибка при проверке пользователей:', error);
        process.exit(1);
    }
}

checkUsers(); 