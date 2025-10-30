const { sequelize, Media } = require('./models');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads');

/**
 * Очистка "сиротских" записей медиафайлов
 * Удаляет записи из БД о файлах, которые больше не существуют на диске
 */
async function cleanupOrphanedMedia() {
    console.log('🧹 Начинаем очистку сиротских медиа-записей...\n');

    try {
        // Получаем все медиа записи
        const allMedia = await Media.findAll({
            attributes: ['id', 'url', 'type']
        });

        console.log(`📊 Найдено ${allMedia.length} медиа-записей в базе данных`);

        let orphanedCount = 0;
        let checkedCount = 0;

        for (const media of allMedia) {
            checkedCount++;

            // Проверяем существование файла
            const fileExists = checkFileExists(media.url);

            if (!fileExists) {
                console.log(`🗑️ Найдена сиротская запись: ID ${media.id}, URL: ${media.url}`);

                // Удаляем запись из БД
                await Media.destroy({
                    where: { id: media.id }
                });

                orphanedCount++;
                console.log(`✅ Удалена сиротская запись ID ${media.id}`);
            }

            // Показываем прогресс каждые 10 проверок
            if (checkedCount % 10 === 0) {
                console.log(`📈 Проверено ${checkedCount}/${allMedia.length} записей...`);
            }
        }

        console.log(`\n✅ Очистка завершена!`);
        console.log(`📊 Удалено ${orphanedCount} сиротских записей`);

    } catch (error) {
        console.error('❌ Ошибка при очистке:', error);
    } finally {
        await sequelize.close();
    }
}

/**
 * Проверяет существование файла по различным возможным путям
 */
function checkFileExists(mediaUrl) {
    // Извлекаем имя файла из URL
    const filename = path.basename(mediaUrl);

    // Возможные пути к файлу
    const possiblePaths = [
        path.join(uploadDir, 'images', filename),
        path.join(uploadDir, 'avatars', filename),
        path.join(uploadDir, 'videoAd', filename),
        path.join(uploadDir, 'audio', filename),
        path.join(__dirname, '../uploads/images', filename),
        path.join(__dirname, '../uploads/avatars', filename),
        path.join(__dirname, '../uploads/videoAd', filename),
        path.join(__dirname, '../uploads/audio', filename),
        // Для случаев когда URL содержит полный путь
        mediaUrl.startsWith('/') ? path.join(__dirname, '..', mediaUrl) : mediaUrl
    ];

    // Проверяем каждый возможный путь
    for (const filePath of possiblePaths) {
        try {
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                return true;
            }
        } catch (error) {
            // Игнорируем ошибки доступа к файлу
            continue;
        }
    }

    return false;
}

// Запуск очистки
if (require.main === module) {
    cleanupOrphanedMedia();
}

module.exports = { cleanupOrphanedMedia };
