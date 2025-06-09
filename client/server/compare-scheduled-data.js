require('dotenv').config();
const { sequelize, ScheduledNews } = require('./models');
const logger = require('./logger');

async function compareScheduledData() {
    try {
        await sequelize.authenticate();
        logger.info('✅ Подключение к базе данных успешно');

        // Получаем все отложенные новости
        const allScheduled = await ScheduledNews.findAll({
            order: [['createdAt', 'DESC']]
        });

        logger.info(`📊 Найдено отложенных новостей: ${allScheduled.length}`);

        allScheduled.forEach((news, index) => {
            logger.info(`\n📰 Новость ${index + 1}:`);
            logger.info(`   - ID: ${news.id}`);
            logger.info(`   - Заголовок: "${news.title}"`);
            logger.info(`   - Статус: ${news.status}`);
            logger.info(`   - Запланировано на: ${news.scheduledDate.toISOString()}`);
            logger.info(`   - Создано: ${news.createdAt.toISOString()}`);
            logger.info(`   - Автор ID: ${news.authorId}`);
            
            // Парсим и показываем newsData
            try {
                const newsData = JSON.parse(news.newsData);
                logger.info(`   - newsData.title: "${newsData.title}"`);
                logger.info(`   - newsData.authorId: ${newsData.authorId}`);
                logger.info(`   - newsData.categoryIds: ${JSON.stringify(newsData.categoryIds)}`);
                logger.info(`   - newsData.publishDate: ${newsData.publishDate || 'не установлено'}`);
                
                if (newsData.mediaFiles) {
                    logger.info(`   - mediaFiles: ${newsData.mediaFiles.length} файлов`);
                    newsData.mediaFiles.forEach((file, i) => {
                        logger.info(`     [${i}] type: ${file.type}, filename: ${file.filename || file.originalName || 'не указано'}`);
                    });
                }
                
                // Проверяем разница во времени между созданием и планированием
                const createdTime = new Date(news.createdAt);
                const scheduledTime = new Date(news.scheduledDate);
                const diffMinutes = Math.round((scheduledTime - createdTime) / (1000 * 60));
                logger.info(`   - Запланировано через: ${diffMinutes} минут от создания`);
                
                // Проверяем готовность к публикации
                const now = new Date();
                const isReady = scheduledTime <= now;
                const minutesUntil = Math.round((scheduledTime - now) / (1000 * 60));
                logger.info(`   - Готово к публикации: ${isReady ? 'ДА' : `НЕТ (через ${minutesUntil} мин)`}`);
                
            } catch (error) {
                logger.error(`   - ❌ Ошибка парсинга newsData: ${error.message}`);
                logger.info(`   - Сырые данные: ${news.newsData}`);
            }
        });

        // Дополнительная проверка готовых к публикации
        const now = new Date();
        const readyToPublish = await ScheduledNews.findAll({
            where: {
                scheduledDate: {
                    [require('sequelize').Op.lte]: now
                },
                status: 'scheduled'
            }
        });

        logger.info(`\n🚀 Готовых к публикации сейчас: ${readyToPublish.length}`);
        readyToPublish.forEach(news => {
            logger.info(`   - "${news.title}" (ID: ${news.id})`);
        });

    } catch (error) {
        logger.error('❌ Ошибка при сравнении данных:', error);
        process.exit(1);
    }
}

compareScheduledData(); 