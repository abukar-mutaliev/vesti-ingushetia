const cron = require('node-cron');
const { News, Category, Media, sequelize, ScheduledNews } = require('../models');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

function validateVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;

    const rutubeRegex = /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
    const youtubeRegex = /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;

    return rutubeRegex.test(url) || youtubeRegex.test(url);
}

class NewsScheduler {
    constructor() {
        this.isRunning = false;
        this.initScheduler();
        this.initCleanup();
    }

    initScheduler() {
        cron.schedule('* * * * *', () => {
            this.checkAndPublishScheduledNews();
        });

    }

    async checkAndPublishScheduledNews() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        try {
            await sequelize.authenticate();

            const now = new Date();

            const scheduledNews = await ScheduledNews.findAll({
                where: {
                    scheduledDate: {
                        [require('sequelize').Op.lte]: now
                    },
                    status: 'scheduled'
                }
            });


            if (scheduledNews.length === 0) {
                const allScheduled = await ScheduledNews.findAll({
                    where: { status: 'scheduled' }
                });

                if (allScheduled.length > 0) {
                    allScheduled.forEach(news => {
                        logger.info(`   - "${news.title}" на ${news.scheduledDate.toISOString()}`);
                    });
                }

                this.isRunning = false;
                return;
            }


            for (const scheduled of scheduledNews) {
                try {
                    logger.info(`📰 Публикация новости: "${scheduled.title}"`);
                    await this.publishScheduledNews(scheduled);
                } catch (error) {
                    logger.error(`❌ Ошибка при публикации новости ID ${scheduled.id}:`, error);

                    await scheduled.update({
                        status: 'error',
                        errorMessage: error.message,
                        lastAttempt: now
                    });
                }
            }
        } catch (error) {
            logger.error('💥 Ошибка в планировщике новостей:', error);
        } finally {
            this.isRunning = false;
        }
    }

    async publishScheduledNews(scheduledNewsItem) {
        const transaction = await sequelize.transaction();

        try {
            const newsData = JSON.parse(scheduledNewsItem.newsData);
            const publishTime = new Date(scheduledNewsItem.scheduledDate);

            console.log('📰 Публикация отложенной новости:', newsData.title);

            const news = await News.create({
                title: newsData.title,
                content: newsData.content,
                authorId: newsData.authorId,
                publishDate: publishTime,
            }, { transaction });

            console.log(`✅ Новость создана с ID: ${news.id}`);

            if (newsData.categoryIds && newsData.categoryIds.length > 0) {
                const categories = await Category.findAll({
                    where: { id: newsData.categoryIds },
                    transaction
                });

                if (categories.length > 0) {
                    await news.addCategories(categories, { transaction });
                    console.log(`✅ Добавлено ${categories.length} категорий`);
                } else {
                    logger.warn(`⚠️ Категории с ID [${newsData.categoryIds.join(', ')}] не найдены`);
                }
            }

            const mediaInstances = [];

            if (newsData.videoUrl && newsData.videoUrl.trim() !== '' && validateVideoUrl(newsData.videoUrl.trim())) {
                const videoMedia = await Media.create({
                    url: newsData.videoUrl.trim(),
                    type: 'video'
                }, { transaction });
                mediaInstances.push(videoMedia);
                console.log(`✅ Видео добавлено: ${newsData.videoUrl.trim()} (ID: ${videoMedia.id})`);
            }

            if (newsData.mediaFiles && newsData.mediaFiles.length > 0) {
                console.log(`📷 Обработка ${newsData.mediaFiles.length} медиафайлов при публикации`);

                for (const [index, mediaFile] of newsData.mediaFiles.entries()) {
                    try {
                        if (mediaFile.type === 'image') {
                            console.log(`📷 Обрабатываем изображение ${index + 1}:`, {
                                filename: mediaFile.filename,
                                originalName: mediaFile.originalName,
                                path: mediaFile.path,
                                url: mediaFile.url,
                                fallback: mediaFile.fallback,
                                placeholder: mediaFile.placeholder,
                                scheduled: mediaFile.scheduled
                            });

                            let finalImageUrl = null;

                            // Вариант 1: Если есть готовый URL и это fallback
                            if (mediaFile.fallback && mediaFile.url) {
                                // Проверяем что файл существует по указанному пути
                                const expectedPath = path.join(__dirname, '../../uploads/images', path.basename(mediaFile.url));
                                if (fs.existsSync(expectedPath)) {
                                    finalImageUrl = mediaFile.url;
                                    console.log(`   ✅ Используем fallback URL: ${finalImageUrl}`);
                                } else {
                                    console.warn(`   ⚠️ Fallback файл не найден: ${expectedPath}`);
                                }
                            }
                            // Вариант 2: Если есть путь к временному файлу
                            else if (mediaFile.path && mediaFile.scheduled && fs.existsSync(mediaFile.path)) {
                                const tempPath = mediaFile.path;

                                // Генерируем финальное имя файла
                                let finalFilename;
                                if (mediaFile.filename && mediaFile.filename.startsWith('scheduled-')) {
                                    // Используем временное имя как основу
                                    const timestamp = Date.now();
                                    const randomSuffix = Math.round(Math.random() * 1E9);
                                    const extension = path.extname(mediaFile.originalName || mediaFile.filename);
                                    finalFilename = `images-${timestamp}-${randomSuffix}${extension}`;
                                } else if (mediaFile.filename) {
                                    finalFilename = mediaFile.filename;
                                } else {
                                    // Генерируем новое имя
                                    const timestamp = Date.now();
                                    const randomSuffix = Math.round(Math.random() * 1E9);
                                    const extension = path.extname(mediaFile.originalName || '');
                                    finalFilename = `images-${timestamp}-${randomSuffix}${extension}`;
                                }

                                // Путь к финальной папке
                                const uploadsDir = path.join(__dirname, '../../uploads/images');
                                if (!fs.existsSync(uploadsDir)) {
                                    fs.mkdirSync(uploadsDir, { recursive: true });
                                }

                                let finalPath = path.join(uploadsDir, finalFilename);

                                // Проверяем уникальность имени файла
                                let counter = 1;
                                while (fs.existsSync(finalPath)) {
                                    const fileExt = path.extname(finalFilename);
                                    const baseName = path.basename(finalFilename, fileExt);
                                    const uniqueFilename = `${baseName}-${counter}${fileExt}`;
                                    finalPath = path.join(uploadsDir, uniqueFilename);
                                    finalFilename = uniqueFilename;
                                    counter++;
                                }

                                // Копируем файл из временной папки в постоянную
                                try {
                                    fs.copyFileSync(tempPath, finalPath);
                                    
                                    if (fs.existsSync(finalPath)) {
                                        finalImageUrl = `uploads/images/${finalFilename}`;
                                        console.log(`   ✅ Файл скопирован в uploads: ${finalFilename}`);
                                    } else {
                                        console.error(`   ❌ Файл не найден после копирования: ${finalPath}`);
                                        finalImageUrl = null;
                                    }
                                } catch (copyError) {
                                    console.error(`   ❌ Ошибка копирования файла:`, copyError);
                                    finalImageUrl = null;
                                }

                                // Удаляем временный файл только если копирование прошло успешно
                                if (finalImageUrl) {
                                    try {
                                        fs.unlinkSync(tempPath);
                                        console.log(`   🗑️ Временный файл удален: ${tempPath}`);
                                    } catch (err) {
                                        console.warn(`   ⚠️ Не удалось удалить временный файл: ${tempPath}`, err.message);
                                    }
                                }
                            }
                            // Вариант 2.5: Поиск файла в temp по альтернативным именам
                            else if (mediaFile.filename && mediaFile.scheduled) {
                                console.log(`   🔍 Поиск файла в temp по альтернативным именам для: ${mediaFile.filename}`);
                                
                                const tempDir = path.join(__dirname, '../temp');
                                if (fs.existsSync(tempDir)) {
                                    const tempFiles = fs.readdirSync(tempDir);
                                    
                                    // Ищем файл, который содержит имя исходного файла
                                    const originalFilename = mediaFile.filename;
                                    const matchingFile = tempFiles.find(file => 
                                        file.includes(originalFilename) || 
                                        originalFilename.includes(file) ||
                                        file.includes(path.basename(originalFilename, path.extname(originalFilename)))
                                    );
                                    
                                    if (matchingFile) {
                                        const tempPath = path.join(tempDir, matchingFile);
                                        console.log(`   ✅ Найден соответствующий файл в temp: ${matchingFile}`);
                                        
                                        // Генерируем финальное имя файла
                                        const timestamp = Date.now();
                                        const randomSuffix = Math.round(Math.random() * 1E9);
                                        const extension = path.extname(mediaFile.originalName || mediaFile.filename);
                                        const finalFilename = `images-${timestamp}-${randomSuffix}${extension}`;

                                        // Путь к финальной папке
                                        const uploadsDir = path.join(__dirname, '../../uploads/images');
                                        if (!fs.existsSync(uploadsDir)) {
                                            fs.mkdirSync(uploadsDir, { recursive: true });
                                        }

                                        let finalPath = path.join(uploadsDir, finalFilename);

                                        // Проверяем уникальность имени файла
                                        let counter = 1;
                                        while (fs.existsSync(finalPath)) {
                                            const fileExt = path.extname(finalFilename);
                                            const baseName = path.basename(finalFilename, fileExt);
                                            const uniqueFilename = `${baseName}-${counter}${fileExt}`;
                                            finalPath = path.join(uploadsDir, uniqueFilename);
                                            finalFilename = uniqueFilename;
                                            counter++;
                                        }

                                        // Копируем файл из временной папки в постоянную
                                        try {
                                            fs.copyFileSync(tempPath, finalPath);
                                            
                                            if (fs.existsSync(finalPath)) {
                                                finalImageUrl = `uploads/images/${finalFilename}`;
                                                console.log(`   ✅ Файл найден и скопирован: ${finalFilename}`);
                                            } else {
                                                console.error(`   ❌ Файл не найден после копирования: ${finalPath}`);
                                                finalImageUrl = null;
                                            }
                                        } catch (copyError) {
                                            console.error(`   ❌ Ошибка копирования файла:`, copyError);
                                            finalImageUrl = null;
                                        }

                                        // Удаляем временный файл только если копирование прошло успешно
                                        if (finalImageUrl) {
                                            try {
                                                fs.unlinkSync(tempPath);
                                                console.log(`   🗑️ Временный файл удален: ${tempPath}`);
                                            } catch (err) {
                                                console.warn(`   ⚠️ Не удалось удалить временный файл: ${tempPath}`, err.message);
                                            }
                                        }
                                    } else {
                                        console.warn(`   ❌ Не найден соответствующий файл в temp для: ${mediaFile.filename}`);
                                        console.log(`   📁 Файлы в temp: ${tempFiles.join(', ')}`);
                                    }
                                }
                            }
                            // Вариант 3: Файл по оригинальному имени в папке изображений
                            else if (mediaFile.filename && !mediaFile.placeholder) {
                                const imagePath = path.join(__dirname, '../../uploads/images', mediaFile.filename);
                                if (fs.existsSync(imagePath)) {
                                    finalImageUrl = `uploads/images/${mediaFile.filename}`;
                                    console.log(`   ✅ Найден файл в uploads: ${finalImageUrl}`);
                                } else {
                                    console.warn(`   ❌ Файл не найден: ${imagePath}`);
                                }
                            }

                            // ИСПРАВЛЕНО: Добавляем дополнительную попытку найти файл
                            if (!finalImageUrl && mediaFile.originalName) {
                                console.log(`   🔍 Дополнительный поиск файла по originalName: ${mediaFile.originalName}`);
                                
                                // Поиск по originalName в uploads
                                const originalPath = path.join(__dirname, '../../uploads/images', mediaFile.originalName);
                                if (fs.existsSync(originalPath)) {
                                    finalImageUrl = `uploads/images/${mediaFile.originalName}`;
                                    console.log(`   ✅ Найден файл по originalName: ${finalImageUrl}`);
                                } else {
                                    // Поиск по originalPath если есть
                                    if (mediaFile.originalPath && fs.existsSync(mediaFile.originalPath)) {
                                        // Копируем оригинальный файл
                                        const timestamp = Date.now();
                                        const randomSuffix = Math.round(Math.random() * 1E9);
                                        const extension = path.extname(mediaFile.originalName);
                                        const recoveredFilename = `recovered-${timestamp}-${randomSuffix}${extension}`;
                                        
                                        const uploadsDir = path.join(__dirname, '../../uploads/images');
                                        if (!fs.existsSync(uploadsDir)) {
                                            fs.mkdirSync(uploadsDir, { recursive: true });
                                        }
                                        
                                        const recoveredPath = path.join(uploadsDir, recoveredFilename);
                                        
                                        try {
                                            fs.copyFileSync(mediaFile.originalPath, recoveredPath);
                                            finalImageUrl = `uploads/images/${recoveredFilename}`;
                                            console.log(`   ✅ Восстановлен файл из originalPath: ${finalImageUrl}`);
                                        } catch (copyError) {
                                            console.error(`   ❌ Ошибка восстановления файла:`, copyError);
                                        }
                                    } else {
                                        console.warn(`   ❌ Файл не найден по всем путям для originalName: ${mediaFile.originalName}`);
                                    }
                                }
                            }

                            if (finalImageUrl) {
                                const imageMedia = await Media.create({
                                    url: finalImageUrl,
                                    type: 'image'
                                }, { transaction });

                                mediaInstances.push(imageMedia);
                                console.log(`   ✅ Изображение добавлено в БД: ${finalImageUrl} (ID: ${imageMedia.id})`);
                            } else {
                                console.error(`   ❌ Не удалось обработать изображение: ${JSON.stringify(mediaFile)}`);
                            }

                        } else if (mediaFile.type === 'video' && mediaFile.url) {
                            const videoUrl = mediaFile.url.trim();
                            const existingVideo = mediaInstances.find(m => m.type === 'video' && m.url === videoUrl);

                            if (!existingVideo && validateVideoUrl(videoUrl)) {
                                const videoMedia = await Media.create({
                                    url: videoUrl,
                                    type: 'video'
                                }, { transaction });
                                mediaInstances.push(videoMedia);
                                logger.info(`✅ Видео из медиафайлов добавлено: ${videoUrl} (ID: ${videoMedia.id})`);
                            }
                        }
                    } catch (error) {
                        logger.error(`❌ Ошибка обработки медиафайла ${index + 1}:`, error);
                    }
                }
            }

            if (mediaInstances.length > 0) {
                await news.addMediaFiles(mediaInstances, { transaction });
                console.log(`✅ Связано ${mediaInstances.length} медиафайлов`);
            } else {
                logger.info(`ℹ️ Медиафайлы отсутствуют`);
            }

            await transaction.commit();

            // Удаляем отложенную новость после успешной публикации
            await scheduledNewsItem.destroy();

            logger.info(`✅ Отложенная новость "${newsData.title}" успешно опубликована`, {
                newsId: news.id,
                originalScheduledDate: scheduledNewsItem.scheduledDate,
                actualPublishDate: news.publishDate,
                createdAt: news.createdAt,
                mediaFilesCount: mediaInstances.length
            });

            return news;

        } catch (error) {
            await transaction.rollback();
            logger.error(`❌ Ошибка публикации отложенной новости:`, error);
            throw error;
        }
    }

    // Исправленный метод scheduleNews в newsScheduler.js

    async scheduleNews(newsData, scheduledDate, authorId) {
        try {
            console.log('🗓️ Планирование новости:', {
                title: newsData.title,
                authorId,
                scheduledDateRaw: scheduledDate,
                scheduledDateISO: new Date(scheduledDate).toISOString(),
                scheduledDateMoscow: new Date(scheduledDate).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
            });

            const processedNewsData = { ...newsData };

            if (newsData.videoUrl && newsData.videoUrl.trim() !== '') {
                processedNewsData.videoUrl = newsData.videoUrl.trim();
            } else {
                processedNewsData.videoUrl = null;
                logger.info(`ℹ️ Видео URL отсутствует`);
            }

            // ИСПРАВЛЕНО: улучшенная обработка медиафайлов
            if (newsData.mediaFiles && newsData.mediaFiles.length > 0) {
                console.log(`📁 Обработка ${newsData.mediaFiles.length} медиафайлов для планировщика`);

                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                    console.log(`📁 Создана временная папка: ${tempDir}`);
                }

                processedNewsData.mediaFiles = await Promise.all(
                    newsData.mediaFiles.map(async (file, index) => {
                        console.log(`📄 Обрабатываем файл ${index + 1}:`, {
                            type: file.type,
                            filename: file.filename,
                            originalname: file.originalname,
                            path: file.path
                        });

                        if (file.type === 'image') {
                            const timestamp = Date.now();
                            const randomSuffix = Math.round(Math.random() * 1E9);
                            const originalExt = path.extname(file.originalname || file.filename || '');
                            const tempFilename = `scheduled-${timestamp}-${randomSuffix}${originalExt}`;
                            const tempPath = path.join(tempDir, tempFilename);

                            let sourcePath = null;

                            // Определяем источник файла
                            if (file.path && fs.existsSync(file.path)) {
                                sourcePath = file.path;
                                console.log(`   📂 Источник: существующий путь ${sourcePath}`);
                            } else if (file.filename) {
                                // Пробуем найти в папке uploads
                                const uploadsPath = path.join(__dirname, '../../uploads/images', file.filename);
                                if (fs.existsSync(uploadsPath)) {
                                    sourcePath = uploadsPath;
                                    console.log(`   📂 Источник: uploads папка ${sourcePath}`);
                                } else {
                                    console.warn(`   ⚠️ Файл не найден в uploads: ${uploadsPath}`);
                                }
                            }

                            if (sourcePath) {
                                try {
                                    // Копируем файл во временную папку
                                    fs.copyFileSync(sourcePath, tempPath);
                                    console.log(`   ✅ Файл скопирован во временную папку: ${tempPath}`);

                                    return {
                                        type: 'image',
                                        filename: tempFilename, // Новое имя во временной папке
                                        originalName: file.originalname || file.filename,
                                        path: tempPath, // Путь к временному файлу
                                        originalPath: sourcePath, // Исходный путь для справки
                                        scheduled: true // Маркер что файл для планировщика
                                    };
                                } catch (copyError) {
                                    console.error(`   ❌ Ошибка копирования файла:`, copyError);

                                    // ИСПРАВЛЕНО: Улучшенный fallback - копируем файл в uploads
                                    try {
                                        const uploadsDir = path.join(__dirname, '../../uploads/images');
                                        if (!fs.existsSync(uploadsDir)) {
                                            fs.mkdirSync(uploadsDir, { recursive: true });
                                        }

                                        const fallbackFilename = `fallback-${timestamp}-${randomSuffix}${originalExt}`;
                                        const fallbackPath = path.join(uploadsDir, fallbackFilename);
                                        
                                        fs.copyFileSync(sourcePath, fallbackPath);
                                        console.log(`   ✅ Создан fallback файл: ${fallbackPath}`);

                                        return {
                                            type: 'image',
                                            filename: fallbackFilename,
                                            originalName: file.originalname || file.filename,
                                            url: `uploads/images/${fallbackFilename}`,
                                            fallback: true
                                        };
                                    } catch (fallbackError) {
                                        console.error(`   ❌ Ошибка создания fallback файла:`, fallbackError);
                                        
                                        // Последний fallback - просто сохраняем информацию
                                        return {
                                            type: 'image',
                                            filename: file.filename,
                                            originalName: file.originalname,
                                            url: `uploads/images/${file.filename}`,
                                            fallback: true,
                                            error: 'Файл может быть недоступен'
                                        };
                                    }
                                }
                            } else {
                                console.warn(`   ⚠️ Источник файла не найден, создаем placeholder`);

                                // Создаем placeholder запись
                                return {
                                    type: 'image',
                                    filename: file.filename || tempFilename,
                                    originalName: file.originalname || 'unknown',
                                    placeholder: true,
                                    url: `uploads/images/${file.filename || tempFilename}`
                                };
                            }
                        }

                        // Для других типов файлов (видео и т.д.)
                        return file;
                    })
                );

                const successfulFiles = processedNewsData.mediaFiles.filter(f => !f.placeholder && !f.error);
                const fallbackFiles = processedNewsData.mediaFiles.filter(f => f.fallback);
                const placeholderFiles = processedNewsData.mediaFiles.filter(f => f.placeholder);
                const errorFiles = processedNewsData.mediaFiles.filter(f => f.error);

                console.log(`✅ Успешно обработано файлов: ${successfulFiles.length}`);
                if (fallbackFiles.length > 0) {
                    console.warn(`⚠️ Создано fallback файлов: ${fallbackFiles.length}`);
                }
                if (placeholderFiles.length > 0) {
                    console.warn(`⚠️ Создано placeholder файлов: ${placeholderFiles.length}`);
                }
                if (errorFiles.length > 0) {
                    console.error(`❌ Файлов с ошибками: ${errorFiles.length}`);
                }
            } else {
                processedNewsData.mediaFiles = [];
                console.log(`ℹ️ Медиафайлы отсутствуют`);
            }

            processedNewsData.authorId = authorId;

            const finalScheduledDate = new Date(scheduledDate);
            if (isNaN(finalScheduledDate.getTime())) {
                throw new Error('Некорректная дата планирования');
            }

            const now = new Date();
            const minAllowedTime = new Date(now.getTime() + 30 * 1000);

            if (finalScheduledDate <= minAllowedTime) {
                console.log('❌ Дата планирования в прошлом:');
                console.log(`   Планируемое время: ${finalScheduledDate.toISOString()}`);
                console.log(`   Текущее время: ${now.toISOString()}`);
                throw new Error('Дата планирования должна быть в будущем');
            }

            // Создаем запись в БД
            const scheduled = await ScheduledNews.create({
                title: newsData.title,
                scheduledDate: finalScheduledDate,
                newsData: JSON.stringify(processedNewsData),
                authorId: authorId,
                status: 'scheduled'
            });

            logger.info(`✅ Новость запланирована:`, {
                id: scheduled.id,
                title: newsData.title,
                scheduledDateUTC: finalScheduledDate.toISOString(),
                scheduledDateMoscow: finalScheduledDate.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
                authorId,
                timeUntilPublication: Math.round((finalScheduledDate.getTime() - now.getTime()) / 1000 / 60),
                mediaFilesCount: processedNewsData.mediaFiles.length
            });

            return scheduled;

        } catch (error) {
            logger.error('❌ Ошибка планирования новости:', error);
            throw error;
        }
    }

    async getScheduledNews(authorId = null) {
        try {
            const where = { status: 'scheduled' };
            if (authorId) {
                where.authorId = authorId;
            }

            return await ScheduledNews.findAll({
                where,
                order: [['scheduledDate', 'ASC']]
            });
        } catch (error) {
            logger.error('Ошибка получения отложенных новостей:', error);
            throw error;
        }
    }



    initCleanup() {
        cron.schedule('0 2 * * *', () => {
            this.cleanupTempFiles();
        });

        cron.schedule('0 3 * * *', () => {
            this.cleanupOrphanedFiles();
        });
    }


    async cleanupOrphanedFiles() {
        try {

            const uploadsDir = path.join(__dirname, '../../uploads/images');
            if (!fs.existsSync(uploadsDir)) {
                return;
            }

            const files = fs.readdirSync(uploadsDir);

            const mediaUrls = await Media.findAll({
                where: { type: 'image' },
                attributes: ['url']
            });

            const usedFilenames = mediaUrls.map(media => path.basename(media.url));

            let deletedCount = 0;
            let skippedCount = 0;

            for (const file of files) {
                if (!usedFilenames.includes(file)) {
                    const filePath = path.join(uploadsDir, file);
                    try {
                        await fs.promises.unlink(filePath);
                        deletedCount++;
                    } catch (error) {
                        logger.error(`Ошибка удаления файла ${file}:`, error);
                    }
                } else {
                    skippedCount++;
                }
            }

            logger.info(`✅ Очистка завершена. Удалено: ${deletedCount}, пропущено: ${skippedCount}`);

        } catch (error) {
            logger.error('Ошибка очистки неиспользуемых файлов:', error);
        }
    }
    // Добавьте эти методы в класс NewsScheduler

// Очистка временных файлов при ошибке или отмене
    async cleanupScheduledNewsFiles(scheduledNewsId) {
        try {
            const scheduledNews = await ScheduledNews.findByPk(scheduledNewsId);
            if (!scheduledNews) return;

            const newsData = JSON.parse(scheduledNews.newsData);
            if (newsData.mediaFiles && newsData.mediaFiles.length > 0) {
                console.log(`🗑️ Очистка файлов для отмененной новости ID: ${scheduledNewsId}`);

                newsData.mediaFiles.forEach(file => {
                    if (file.path && file.scheduled && fs.existsSync(file.path)) {
                        try {
                            fs.unlinkSync(file.path);
                            console.log(`   ✅ Удален временный файл: ${file.path}`);
                        } catch (err) {
                            console.error(`   ❌ Ошибка удаления файла ${file.path}:`, err.message);
                        }
                    }
                });
            }
        } catch (error) {
            logger.error('Ошибка очистки файлов отложенной новости:', error);
        }
    }

// Переопределяем метод отмены новости
    async cancelScheduledNews(id, authorId) {
        try {
            const scheduled = await ScheduledNews.findOne({
                where: {
                    id,
                    authorId,
                    status: 'scheduled'
                }
            });

            if (!scheduled) {
                throw new Error('Отложенная новость не найдена');
            }

            // Очищаем файлы перед удалением
            await this.cleanupScheduledNewsFiles(id);

            await scheduled.destroy();

            logger.info(`✅ Отложенная новость отменена: ${scheduled.title} (ID: ${id})`);

        } catch (error) {
            logger.error('Ошибка отмены отложенной новости:', error);
            throw error;
        }
    }

// Улучшенная очистка временных файлов по расписанию
    async cleanupTempFiles() {
        try {
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) return;

            const files = fs.readdirSync(tempDir);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 часа
            let deletedCount = 0;

            console.log(`🧹 Очистка временных файлов: найдено ${files.length} файлов`);

            for (const file of files) {
                const filePath = path.join(tempDir, file);

                try {
                    const stats = fs.statSync(filePath);
                    const fileAge = now - stats.mtime.getTime();

                    if (fileAge > maxAge) {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                        console.log(`   🗑️ Удален устаревший файл: ${file}
                         (возраст: ${Math.round(fileAge / 1000 / 60 / 60)} часов)`);
                    }
                } catch (err) {
                    console.error(`   ❌ Ошибка обработки файла ${file}:`, err.message);
                }
            }

            if (deletedCount > 0) {
                logger.info(`✅ Очистка временных файлов завершена. Удалено: ${deletedCount}`);
            }
        } catch (error) {
            logger.error('Ошибка очистки временных файлов:', error);
        }
    }

// Проверка целостности файлов отложенных новостей
    async checkScheduledNewsIntegrity() {
        try {
            const scheduledNews = await ScheduledNews.findAll({
                where: { status: 'scheduled' }
            });

            console.log(`🔍 Проверка целостности ${scheduledNews.length} отложенных новостей`);

            for (const news of scheduledNews) {
                try {
                    const newsData = JSON.parse(news.newsData);
                    if (newsData.mediaFiles && newsData.mediaFiles.length > 0) {
                        let missingFiles = 0;

                        newsData.mediaFiles.forEach(file => {
                            if (file.path && file.scheduled && !fs.existsSync(file.path)) {
                                missingFiles++;
                                console.warn(`   ⚠️ Отсутствует файл для новости "${news.title}": ${file.path}`);
                            }
                        });

                        if (missingFiles > 0) {
                            logger.warn(`Обнаружены отсутствующие файлы для новости ID ${news.id}: ${missingFiles} файлов`);
                        }
                    }
                } catch (err) {
                    logger.error(`Ошибка проверки новости ID ${news.id}:`, err.message);
                }
            }
        } catch (error) {
            logger.error('Ошибка проверки целостности отложенных новостей:', error);
        }
    }
}

const newsScheduler = new NewsScheduler();

module.exports = newsScheduler;