require('dotenv').config();
const { sequelize, ScheduledNews } = require('./models');
const logger = require('./logger');

async function createTestScheduledNews() {
    try {
        await sequelize.authenticate();
        logger.info('✅ Подключение к базе данных успешно');

        // Создаем тестовую новость на 2 минуты вперед
        const now = new Date();
        const scheduledTime = new Date(now.getTime() + 2 * 60 * 1000); // +2 минуты

        const testNewsData = {
            title: 'ТЕСТОВАЯ АВТОПУБЛИКАЦИЯ',
            content: 'Это тестовая новость для проверки автоматической публикации. Создана в ' + now.toISOString(),
            authorId: 1, // ID администратора
            categoryIds: [1], // ID категории
            mediaFiles: []
        };

        const scheduledNews = await ScheduledNews.create({
            title: testNewsData.title,
            scheduledDate: scheduledTime,
            newsData: JSON.stringify(testNewsData),
            authorId: testNewsData.authorId,
            status: 'scheduled'
        });

        logger.info(`🚀 Создана тестовая новость:`);
        logger.info(`   - Заголовок: "${testNewsData.title}"`);
        logger.info(`   - Текущее время: ${now.toISOString()}`);
        logger.info(`   - Запланировано на: ${scheduledTime.toISOString()}`);
        logger.info(`   - Время до публикации: 2 минуты`);
        logger.info(`   - ID записи: ${scheduledNews.id}`);

        console.log('\n🎯 Теперь запустите основной сервер или test-scheduler.js');
        console.log('   и через 2 минуты новость должна автоматически опубликоваться');

    } catch (error) {
        logger.error('❌ Ошибка при создании тестовой новости:', error);
        process.exit(1);
    }
}

createTestScheduledNews(); 