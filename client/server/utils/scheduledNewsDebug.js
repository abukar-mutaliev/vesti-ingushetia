const fs = require('fs');
const path = require('path');
const { ScheduledNews } = require('../models');

class ScheduledNewsDebugger {
    async checkScheduledNews() {
        try {
            console.log('🔍 === ДИАГНОСТИКА ОТЛОЖЕННЫХ НОВОСТЕЙ ===');
            
            const scheduledNews = await ScheduledNews.findAll({
                where: { status: 'scheduled' },
                order: [['scheduledDate', 'ASC']]
            });

            console.log(`📋 Найдено отложенных новостей: ${scheduledNews.length}`);

            for (const news of scheduledNews) {
                console.log(`\n📰 --- Новость ID: ${news.id} ---`);
                console.log(`   Заголовок: ${news.title}`);
                console.log(`   Дата планирования: ${news.scheduledDate}`);
                console.log(`   Статус: ${news.status}`);
                console.log(`   Автор ID: ${news.authorId}`);

                try {
                    const newsData = JSON.parse(news.newsData);
                    console.log(`   Категории: ${newsData.categoryIds?.length || 0}`);
                    console.log(`   Видео URL: ${newsData.videoUrl ? 'есть' : 'нет'}`);
                    console.log(`   Медиафайлы: ${newsData.mediaFiles?.length || 0}`);

                    if (newsData.mediaFiles && newsData.mediaFiles.length > 0) {
                        console.log(`   📁 Анализ медиафайлов:`);
                        
                        for (const [index, media] of newsData.mediaFiles.entries()) {
                            console.log(`      ${index + 1}. Тип: ${media.type}`);
                            console.log(`         Filename: ${media.filename || 'нет'}`);
                            console.log(`         OriginalName: ${media.originalName || 'нет'}`);
                            console.log(`         Path: ${media.path || 'нет'}`);
                            console.log(`         URL: ${media.url || 'нет'}`);
                            console.log(`         Fallback: ${media.fallback ? 'да' : 'нет'}`);
                            console.log(`         Placeholder: ${media.placeholder ? 'да' : 'нет'}`);
                            console.log(`         Scheduled: ${media.scheduled ? 'да' : 'нет'}`);

                            // Проверяем файлы
                            if (media.path) {
                                const exists = fs.existsSync(media.path);
                                console.log(`         Файл существует: ${exists ? '✅' : '❌'}`);
                                if (exists) {
                                    const stats = fs.statSync(media.path);
                                    console.log(`         Размер: ${stats.size} байт`);
                                    console.log(`         Изменен: ${stats.mtime.toISOString()}`);
                                }
                            }

                            if (media.url && media.url.startsWith('uploads/')) {
                                const uploadsPath = path.join(__dirname, '../uploads/images', path.basename(media.url));
                                const uploadsExists = fs.existsSync(uploadsPath);
                                console.log(`         Файл в uploads: ${uploadsExists ? '✅' : '❌'}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`   ❌ Ошибка парсинга newsData: ${error.message}`);
                }
            }

            console.log('\n🔍 === ПРОВЕРКА ВРЕМЕННЫХ ФАЙЛОВ ===');
            const tempDir = path.join(__dirname, '../temp');
            if (fs.existsSync(tempDir)) {
                const tempFiles = fs.readdirSync(tempDir);
                console.log(`📁 Временных файлов: ${tempFiles.length}`);
                
                tempFiles.forEach(file => {
                    if (file.startsWith('scheduled-')) {
                        const filePath = path.join(tempDir, file);
                        const stats = fs.statSync(filePath);
                        const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
                        console.log(`   📄 ${file} (${Math.round(ageHours * 100)/100} часов)`);
                    }
                });
            } else {
                console.log('📁 Временная папка не существует');
            }

            console.log('\n🔍 === ПРОВЕРКА UPLOADS ===');
            const uploadsDir = path.join(__dirname, '../uploads/images');
            if (fs.existsSync(uploadsDir)) {
                const uploadFiles = fs.readdirSync(uploadsDir).filter(f => 
                    f.startsWith('fallback-') || f.startsWith('scheduled-') || f.startsWith('images-')
                );
                console.log(`📁 Релевантных файлов в uploads: ${uploadFiles.length}`);
                
                uploadFiles.slice(0, 10).forEach(file => {
                    const filePath = path.join(uploadsDir, file);
                    const stats = fs.statSync(filePath);
                    console.log(`   📷 ${file} (${stats.size} байт)`);
                });
                
                if (uploadFiles.length > 10) {
                    console.log(`   ... и еще ${uploadFiles.length - 10} файлов`);
                }
            } else {
                console.log('📁 Папка uploads не существует');
            }

        } catch (error) {
            console.error('❌ Ошибка диагностики:', error);
        }
    }

    async checkSpecificNews(newsId) {
        try {
            const news = await ScheduledNews.findByPk(newsId);
            if (!news) {
                console.log(`❌ Новость с ID ${newsId} не найдена`);
                return;
            }

            console.log(`🔍 === ДЕТАЛЬНАЯ ДИАГНОСТИКА НОВОСТИ ID: ${newsId} ===`);
            console.log(`   Заголовок: ${news.title}`);
            console.log(`   Дата планирования: ${news.scheduledDate}`);
            console.log(`   Время до публикации: ${Math.round((new Date(news.scheduledDate) - new Date()) / 1000 / 60)} минут`);

            const newsData = JSON.parse(news.newsData);
            console.log('📋 Данные новости:', JSON.stringify(newsData, null, 2));

        } catch (error) {
            console.error('❌ Ошибка детальной диагностики:', error);
        }
    }
}

module.exports = new ScheduledNewsDebugger(); 