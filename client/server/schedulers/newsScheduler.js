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

            console.log('📰 Публикация отложенной новости:', {
                title: newsData.title,
                scheduledTime: scheduledNewsItem.scheduledDate,
                publishTime: publishTime.toISOString(),
                publishTimeMoscow: publishTime.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
            });

            const news = await News.create({
                title: newsData.title,
                content: newsData.content,
                authorId: newsData.authorId,
                publishDate: publishTime,
            }, { transaction });

            console.log(`✅ Новость создана с ID: ${news.id}`);
            console.log(`   publishDate: ${news.publishDate}`);
            console.log(`   createdAt: ${news.createdAt}`);

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

            if (newsData.videoUrl && newsData.videoUrl.trim() !== '') {
                const videoUrl = newsData.videoUrl.trim();

                if (validateVideoUrl(videoUrl)) {
                    const videoMedia = await Media.create({
                        url: videoUrl,
                        type: 'video'
                    }, { transaction });
                    mediaInstances.push(videoMedia);
                    logger.info(`✅ Видео добавлено: ${videoUrl} (ID: ${videoMedia.id})`);
                } else {
                    logger.warn(`⚠️ Некорректный URL видео: ${videoUrl}`);
                }
            }

            if (newsData.mediaFiles && newsData.mediaFiles.length > 0) {
                for (const [index, mediaFile] of newsData.mediaFiles.entries()) {
                    try {
                        if (mediaFile.type === 'video' && mediaFile.url) {
                            const videoUrl = mediaFile.url.trim();
                            const existingVideo = mediaInstances.find(m => m.type === 'video' && m.url === videoUrl);

                            if (!existingVideo) {
                                if (validateVideoUrl(videoUrl)) {
                                    const videoMedia = await Media.create({
                                        url: videoUrl,
                                        type: 'video'
                                    }, { transaction });
                                    mediaInstances.push(videoMedia);
                                    logger.info(`✅ Видео из медиафайлов добавлено: ${videoUrl} (ID: ${videoMedia.id})`);
                                } else {
                                    logger.warn(`⚠️ Некорректный URL видео из медиафайлов: ${videoUrl}`);
                                }
                            } else {
                                logger.info(`ℹ️ Видео уже добавлено, пропускаем дубликат: ${videoUrl}`);
                            }

                        } else if (mediaFile.type === 'image') {
                            let finalUrl = null;

                            if (mediaFile.url && !mediaFile.path) {
                                finalUrl = mediaFile.url;
                                logger.info(`📷 Используем существующий URL: ${finalUrl}`);
                            } else if (mediaFile.path && mediaFile.filename) {
                                const tempPath = mediaFile.path;
                                let finalFilename;

                                if (mediaFile.filename.match(/^\d+-/)) {
                                    finalFilename = mediaFile.filename.replace(/^\d+-/, '');
                                } else {
                                    finalFilename = mediaFile.filename;
                                }

                                const finalPath = path.join(__dirname, '../uploads/images', finalFilename);

                                if (fs.existsSync(tempPath)) {
                                    const uploadsDir = path.join(__dirname, '../uploads/images');
                                    if (!fs.existsSync(uploadsDir)) {
                                        fs.mkdirSync(uploadsDir, { recursive: true });
                                    }

                                    let uniqueFinalPath = finalPath;
                                    let counter = 1;
                                    while (fs.existsSync(uniqueFinalPath)) {
                                        const fileExt = path.extname(finalFilename);
                                        const baseName = path.basename(finalFilename, fileExt);
                                        const uniqueFilename = `${baseName}-${counter}${fileExt}`;
                                        uniqueFinalPath = path.join(__dirname, '../uploads/images', uniqueFilename);
                                        counter++;
                                    }

                                    fs.copyFileSync(tempPath, uniqueFinalPath);
                                    finalUrl = `uploads/images/${path.basename(uniqueFinalPath)}`;
                                } else {
                                    logger.warn(`❌ Временный файл не найден: ${tempPath}`);
                                    continue;
                                }
                            } else {
                                logger.warn(`⚠️ Неполные данные файла: ${JSON.stringify(mediaFile)}`);
                                continue;
                            }

                            if (finalUrl) {
                                const imageMedia = await Media.create({
                                    url: finalUrl,
                                    type: 'image'
                                }, { transaction });
                                mediaInstances.push(imageMedia);
                                logger.info(`✅ Изображение добавлено: ${finalUrl} (ID: ${imageMedia.id})`);
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

            await scheduledNewsItem.destroy();

            logger.info(`✅ Отложенная новость "${newsData.title}" успешно опубликована`, {
                newsId: news.id,
                originalScheduledDate: scheduledNewsItem.scheduledDate,
                actualPublishDate: news.publishDate,
                createdAt: news.createdAt
            });

            return news;

        } catch (error) {
            await transaction.rollback();
            logger.error(`❌ Ошибка публикации отложенной новости:`, error);
            throw error;
        }
    }


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

            if (newsData.mediaFiles && newsData.mediaFiles.length > 0) {
                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                processedNewsData.mediaFiles = await Promise.all(
                    newsData.mediaFiles.map(async (file) => {
                        if (file.type === 'image') {
                            const tempFilename = `${Date.now()}-${file.filename}`;
                            const tempPath = path.join(tempDir, tempFilename);

                            let sourcePath;
                            if (file.path && fs.existsSync(file.path)) {
                                sourcePath = file.path;
                            } else if (file.filename) {
                                sourcePath = path.join(__dirname, '../uploads/images', file.filename);
                            }

                            if (sourcePath && fs.existsSync(sourcePath)) {
                                fs.copyFileSync(sourcePath, tempPath);

                                return {
                                    type: 'image',
                                    filename: tempFilename,
                                    originalName: file.originalname || file.originalName,
                                    path: tempPath
                                };
                            } else {
                                logger.warn(`⚠️ Исходный файл не найден: ${sourcePath}`);
                                if (file.url) {
                                    return {
                                        type: 'image',
                                        filename: file.filename,
                                        originalName: file.originalname || file.originalName,
                                        url: file.url
                                    };
                                }

                                return {
                                    type: 'image',
                                    filename: file.filename,
                                    originalName: file.originalname || file.originalName,
                                    url: `uploads/images/${file.filename}`
                                };
                            }
                        }
                        return file;
                    })
                );
            } else {
                processedNewsData.mediaFiles = [];
            }

            processedNewsData.authorId = authorId;

            const finalScheduledDate = new Date(scheduledDate);
            if (isNaN(finalScheduledDate.getTime())) {
                throw new Error('Некорректная дата планирования');
            }

            const now = new Date();
            const minAllowedTime = new Date(now.getTime() + 30 * 1000); // +30 секунд буфер

            if (finalScheduledDate <= minAllowedTime) {
                console.log('❌ Дата планирования в прошлом:');
                console.log(`   Планируемое время: ${finalScheduledDate.toISOString()}`);
                console.log(`   Текущее время: ${now.toISOString()}`);
                console.log(`   Минимально допустимое: ${minAllowedTime.toISOString()}`);

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
                timeUntilPublication: Math.round((finalScheduledDate.getTime() - now.getTime()) / 1000 / 60) // минут до публикации
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

            const newsData = JSON.parse(scheduled.newsData);
            if (newsData.mediaFiles) {
                newsData.mediaFiles.forEach(file => {
                    if (file.path && fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }

            await scheduled.destroy();

        } catch (error) {
            logger.error('Ошибка отмены отложенной новости:', error);
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

    async cleanupTempFiles() {
        try {
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) return;

            const files = fs.readdirSync(tempDir);
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (error) {
            logger.error('Ошибка очистки временных файлов:', error);
        }
    }

    async cleanupOrphanedFiles() {
        try {

            const uploadsDir = path.join(__dirname, '../uploads/images');
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
}

const newsScheduler = new NewsScheduler();

module.exports = newsScheduler;