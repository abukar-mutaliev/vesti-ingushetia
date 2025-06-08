require('dotenv').config();
const { sequelize, ScheduledNews } = require('./models');
const logger = require('./logger');

async function testScheduler() {
    try {
        // Проверяем подключение к базе данных
        await sequelize.authenticate();
        logger.info('✅ Подключение к базе данных успешно');

        // Проверяем наличие отложенных новостей
        const scheduledNews = await ScheduledNews.findAll({
            where: { status: 'scheduled' }
        });

        logger.info(`📰 Найдено ${scheduledNews.length} отложенных новостей`);

        if (scheduledNews.length > 0) {
            scheduledNews.forEach(news => {
                logger.info(`- "${news.title}" запланирована на ${news.scheduledDate}`);
            });
        }

        // Инициализируем планировщик
        const newsScheduler = require('./schedulers/newsScheduler');
        logger.info('🚀 Планировщик новостей запущен успешно');

        // Держим процесс активным для тестирования
        logger.info('⏳ Планировщик работает... Нажмите Ctrl+C для остановки');
        
    } catch (error) {
        logger.error('❌ Ошибка при тестировании планировщика:', error);
        process.exit(1);
    }
}

testScheduler(); 