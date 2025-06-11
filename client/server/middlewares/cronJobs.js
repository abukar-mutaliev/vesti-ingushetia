const cron = require('node-cron');
const { VideoAd } = require('../models');
const { Op } = require('sequelize');

require('../schedulers/newsScheduler');

cron.schedule('0 * * * *', async () => {
    try {
        const now = new Date();

        const expiredAds = await VideoAd.findAll({
            where: {
                expirationDate: {
                    [Op.lt]: now,
                },
                status: 'active',
            },
        });

        for (const ad of expiredAds) {
            ad.status = 'paused';
            await ad.save();
        }
    } catch (error) {
        console.error('Ошибка в cron job для видеорекламы:', error);
    }
});
