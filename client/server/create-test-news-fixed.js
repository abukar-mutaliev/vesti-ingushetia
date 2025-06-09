require('dotenv').config();
const { sequelize, ScheduledNews } = require('./models');
const logger = require('./logger');

async function createTestScheduledNews() {
    try {
        await sequelize.authenticate();
        logger.info('✅ Подключение к базе данных успешно');

        // Детальная диагностика времени
        const now = new Date();
        const scheduledTime = new Date(now.getTime() + 2 * 60 * 1000); // +2 минуты

        logger.info(`🕐 Диагностика времени:`);
        logger.info(`   - now.getTime(): ${now.getTime()}`);
        logger.info(`   - now.toISOString(): ${now.toISOString()}`);
        logger.info(`   - scheduledTime.getTime(): ${scheduledTime.getTime()}`);
        logger.info(`   - scheduledTime.toISOString(): ${scheduledTime.toISOString()}`);

        const testNewsData = {
            title: 'ТЕСТОВАЯ АВТОПУБЛИКАЦИЯ ИСПРАВЛЕННАЯ',
            content: 'Это исправленная тестовая новость для проверки автоматической публикации. Создана в ' + now.toISOString(),
            authorId: 6, // ID администратора (admin)
            categoryIds: [1], // ID категории "Новости"
            mediaFiles: []
        };

        logger.info(`📝 Данные для создания:`);
        logger.info(`   - title: ${testNewsData.title}`);
        logger.info(`   - scheduledDate: ${scheduledTime}`);
        logger.info(`   - scheduledDate ISO: ${scheduledTime.toISOString()}`);

        // Создаем запись БЕЗ обертки в new Date() - просто передаем готовый объект
        const scheduledNews = await ScheduledNews.create({
            title: testNewsData.title,
            scheduledDate: scheduledTime, // Передаем уже готовый Date объект
            newsData: JSON.stringify(testNewsData),
            authorId: testNewsData.authorId,
            status: 'scheduled'
        });

        logger.info(`🚀 Создана исправленная тестовая новость:`);
        logger.info(`   - Заголовок: "${testNewsData.title}"`);
        logger.info(`   - Автор ID: ${testNewsData.authorId} (admin)`);
        logger.info(`   - Категория ID: ${testNewsData.categoryIds[0]} (Новости)`);
        logger.info(`   - Текущее время: ${now.toISOString()}`);
        logger.info(`   - Запланировано на: ${scheduledTime.toISOString()}`);
        logger.info(`   - ID записи: ${scheduledNews.id}`);

        // Проверяем что действительно сохранилось в базе
        const savedNews = await ScheduledNews.findByPk(scheduledNews.id);
        logger.info(`\n✅ Проверка сохраненной записи:`);
        logger.info(`   - Сохранено как: ${savedNews.scheduledDate.toISOString()}`);
        logger.info(`   - Разница с ожидаемым: ${savedNews.scheduledDate.getTime() - scheduledTime.getTime()}ms`);

        console.log('\n🎯 Теперь запустите test-scheduler.js');
        console.log('   и через 2 минуты новость должна автоматически опубликоваться');

    } catch (error) {
        logger.error('❌ Ошибка при создании тестовой новости:', error);
        process.exit(1);
    }
}

createTestScheduledNews(); 