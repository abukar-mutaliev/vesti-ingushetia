const cron = require("node-cron");
const { VideoAd } = require("../models");
const { Op } = require("sequelize");

cron.schedule("0 * * * *", async () => {
  try {
    console.log("Запуск задания по проверке истечения срока видеорекламы");

    const now = new Date();

    const expiredAds = await VideoAd.findAll({
      where: {
        expirationDate: {
          [Op.lt]: now,
        },
        status: "active",
      },
    });

    for (const ad of expiredAds) {
      ad.status = "paused";
      await ad.save();
      console.log(`Видеореклама с ID ${ad.id} приостановлена`);
    }

    console.log("Задание по проверке истечения срока видеорекламы завершено");
  } catch (error) {
    console.error("Ошибка в cron job для видеорекламы:", error);
  }
});
