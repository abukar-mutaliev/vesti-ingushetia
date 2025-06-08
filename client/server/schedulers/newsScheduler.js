const cron = require('node-cron');
const { News, Category, Media, sequelize, ScheduledNews } = require('../models');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

class NewsScheduler {
    constructor() {
        this.isRunning = false;
        this.initScheduler();
    }

    initScheduler() {
        cron.schedule('* * * * *', () => {
            this.checkAndPublishScheduledNews();
        });

        logger.info('Планировщик новостей запущен - проверка каждую минуту');
    }

    async checkAndPublishScheduledNews() {
        if (this.isRunning) return;

        this.isRunning = true;

        try {
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
                this.isRunning = false;
                return;
            }

            logger.info(`Найдено ${scheduledNews.length} новостей для публикации`);

            for (const scheduled of scheduledNews) {
                try {
                    await this.publishScheduledNews(scheduled);
                } catch (error) {
                    logger.error(`Ошибка при публикации новости ID ${scheduled.id}:`, error);

                    await scheduled.update({
                        status: 'error',
                        errorMessage: error.message,
                        lastAttempt: now
                    });
                }
            }
        } catch (error) {
            logger.error('Ошибка в планировщике новостей:', error);
        } finally {
            this.isRunning = false;
        }
    }

    async publishScheduledNews(scheduledNewsItem) {
        const transaction = await sequelize.transaction();

        try {
            const newsData = JSON.parse(scheduledNewsItem.newsData);

            const news = await News.create({
                title: newsData.title,
                content: newsData.content,
                authorId: newsData.authorId,
                publishDate: newsData.publishDate || new Date()
            }, { transaction });

            if (newsData.categoryIds && newsData.categoryIds.length > 0) {
                const categories = await Category.findAll({
                    where: { id: newsData.categoryIds },
                    transaction
                });
                await news.addCategories(categories, { transaction });
            }

            if (newsData.mediaFiles && newsData.mediaFiles.length > 0) {
                const mediaInstances = [];

                for (const mediaFile of newsData.mediaFiles) {
                    if (mediaFile.type === 'video' && mediaFile.url) {
                        const media = await Media.create({
                            url: mediaFile.url,
                            type: 'video'
                        }, { transaction });
                        mediaInstances.push(media);
                    } else if (mediaFile.type === 'image' && mediaFile.path) {
                        const tempPath = path.join(__dirname, '../temp', mediaFile.filename);
                        const finalPath = path.join(__dirname, '../uploads/images', mediaFile.filename);

                        if (fs.existsSync(tempPath)) {
                            fs.renameSync(tempPath, finalPath);

                            const media = await Media.create({
                                url: `uploads/images/${mediaFile.filename}`,
                                type: 'image'
                            }, { transaction });
                            mediaInstances.push(media);
                        }
                    }
                }

                if (mediaInstances.length > 0) {
                    await news.addMediaFiles(mediaInstances, { transaction });
                }
            }

            await transaction.commit();

            await scheduledNewsItem.destroy();

            logger.info(`Успешно опубликована отложенная новость: "${newsData.title}"`);

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async scheduleNews(newsData, scheduledDate, authorId) {
        try {
            const processedNewsData = { ...newsData };

            if (newsData.mediaFiles) {
                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                processedNewsData.mediaFiles = await Promise.all(
                    newsData.mediaFiles.map(async (file) => {
                        if (file.type === 'image') {
                            const tempFilename = `${Date.now()}-${file.filename}`;
                            const tempPath = path.join(tempDir, tempFilename);

                            // Копируем файл во временную папку
                            fs.copyFileSync(file.path, tempPath);

                            return {
                                type: 'image',
                                filename: tempFilename,
                                originalName: file.originalname,
                                path: tempPath
                            };
                        }
                        return file;
                    })
                );
            }

            processedNewsData.authorId = authorId;

            const scheduled = await ScheduledNews.create({
                title: newsData.title,
                scheduledDate: new Date(scheduledDate),
                newsData: JSON.stringify(processedNewsData),
                authorId: authorId,
                status: 'scheduled'
            });

            logger.info(`Новость запланирована на ${scheduledDate}: "${newsData.title}"`);
            return scheduled;

        } catch (error) {
            logger.error('Ошибка планирования новости:', error);
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
            logger.info(`Отложенная новость отменена: "${scheduled.title}"`);

        } catch (error) {
            logger.error('Ошибка отмены отложенной новости:', error);
            throw error;
        }
    }

    initCleanup() {
        cron.schedule('0 2 * * *', () => {
            this.cleanupTempFiles();
        });
    }

    async cleanupTempFiles() {
        try {
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) return;

            const files = fs.readdirSync(tempDir);
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней

            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                    logger.info(`Удален старый временный файл: ${file}`);
                }
            }
        } catch (error) {
            logger.error('Ошибка очистки временных файлов:', error);
        }
    }
}

const newsScheduler = new NewsScheduler();
newsScheduler.initCleanup();

module.exports = newsScheduler;