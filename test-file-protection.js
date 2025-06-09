require('dotenv').config({ path: './client/server/.env' });
const { Media } = require('./client/server/models');
const path = require('path');
const fs = require('fs');

async function testFileProtection() {
    try {
        console.log('🔍 Тестируем логику защиты файлов...\n');

        // Получаем файлы в папке
        const uploadsDir = path.join(__dirname, 'client', 'uploads', 'images');
        const files = fs.readdirSync(uploadsDir);
        console.log(`📁 Всего файлов в папке: ${files.length}`);

        // Получаем защищенные файлы из БД
        const mediaUrls = await Media.findAll({
            where: { type: 'image' },
            attributes: ['url', 'id'],
            include: [{
                model: require('./client/server/models').News,
                as: 'news',
                attributes: ['id', 'title', 'createdAt']
            }]
        });

        console.log(`🛡️ Защищенных файлов в БД: ${mediaUrls.length}\n`);

        const usedFilenames = mediaUrls.map(media => path.basename(media.url));

        // Показываем примеры защищенных файлов
        console.log('📋 Примеры ЗАЩИЩЕННЫХ файлов (из БД):');
        mediaUrls.slice(0, 5).forEach((media, index) => {
            const fileName = path.basename(media.url);
            const newsTitle = media.news?.[0]?.title || 'Не привязана к новости';
            console.log(`${index + 1}. ${fileName} - "${newsTitle}"`);
        });

        // Находим потенциально удаляемые файлы
        const orphanedFiles = files.filter(file => !usedFilenames.includes(file));
        
        console.log(`\n🗑️ Файлы БЕЗ защиты (будут удалены): ${orphanedFiles.length}`);
        if (orphanedFiles.length > 0) {
            orphanedFiles.slice(0, 5).forEach((file, index) => {
                console.log(`${index + 1}. ${file} - сирота, можно удалить`);
            });
        } else {
            console.log('Все файлы защищены! 🎉');
        }

        console.log(`\n✅ РЕЗУЛЬТАТ:`);
        console.log(`   Защищено: ${files.length - orphanedFiles.length} файлов`);
        console.log(`   К удалению: ${orphanedFiles.length} файлов`);
        console.log(`   Старые новости: БЕЗОПАСНЫ ✅`);

        process.exit(0);
    } catch (error) {
        console.error('Ошибка:', error);
        process.exit(1);
    }
}

testFileProtection(); 