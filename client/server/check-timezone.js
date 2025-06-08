require('dotenv').config();
const { sequelize, ScheduledNews } = require('./models');
const logger = require('./logger');

async function checkTimezone() {
    try {
        await sequelize.authenticate();
        logger.info('✅ Подключение к базе данных успешно');

        // Проверяем настройки часового пояса в PostgreSQL
        const [dbTimezone] = await sequelize.query('SHOW timezone;');
        logger.info(`🌍 Часовой пояс PostgreSQL: ${dbTimezone[0].TimeZone}`);

        const [dbTime] = await sequelize.query('SELECT NOW() as current_time;');
        logger.info(`🕒 Время в PostgreSQL: ${dbTime[0].current_time}`);

        // Проверяем настройки Node.js
        logger.info(`🟢 Часовой пояс Node.js: ${process.env.TZ || 'не установлен'}`);
        logger.info(`🟢 Время Node.js: ${new Date().toISOString()}`);

        // Проверяем отложенные новости напрямую из БД
        const [rawScheduled] = await sequelize.query(`
            SELECT id, title, "scheduledDate", status 
            FROM "ScheduledNews" 
            WHERE status = 'scheduled'
            ORDER BY "scheduledDate";
        `);

        logger.info(`📅 Отложенные новости (прямой SQL):`);
        rawScheduled.forEach(news => {
            logger.info(`   - "${news.title}" на ${news.scheduledDate}`);
        });

        // Проверяем через Sequelize
        const sequelizeScheduled = await ScheduledNews.findAll({
            where: { status: 'scheduled' },
            order: [['scheduledDate', 'ASC']]
        });

        logger.info(`📅 Отложенные новости (через Sequelize):`);
        sequelizeScheduled.forEach(news => {
            logger.info(`   - "${news.title}" на ${news.scheduledDate.toISOString()}`);
        });

        // Тест создания времени
        const testTime = new Date();
        const testTimeIn2Min = new Date(testTime.getTime() + 2 * 60 * 1000);
        
        logger.info(`\n🧪 Тест времени:`);
        logger.info(`   - Сейчас JS: ${testTime.toISOString()}`);
        logger.info(`   - +2 мин JS: ${testTimeIn2Min.toISOString()}`);

    } catch (error) {
        logger.error('❌ Ошибка при проверке часового пояса:', error);
        process.exit(1);
    }
}

checkTimezone(); 