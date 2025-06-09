const cron = require('node-cron');
const { News, Category, Media, sequelize, ScheduledNews } = require('../models');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

class NewsScheduler {
    constructor() {
        this.isRunning = false;
        this.initScheduler();
        this.initCleanup();
        logger.info('NewsScheduler инициализирован');
    }

    initScheduler() {
        cron.schedule('* * * * *', () => {
            this.checkAndPublishScheduledNews();
        });

        logger.info('Планировщик новостей запущен - проверка каждую минуту');
    }

    async checkAndPublishScheduledNews() {
        if (this.isRunning) {
            logger.info('Планировщик уже выполняется, пропускаем итерацию');
            return;
        }

        this.isRunning = true;
        logger.info('🔄 Запуск проверки отложенных новостей...');

        try {
            await sequelize.authenticate();
            logger.info('✅ Подключение к БД в планировщике успешно');
            
            const now = new Date();
            logger.info(`⏰ Текущее время: ${now.toISOString()}`);

            const scheduledNews = await ScheduledNews.findAll({
                where: {
                    scheduledDate: {
                        [require('sequelize').Op.lte]: now
                    },
                    status: 'scheduled'
                }
            });

            logger.info(`📊 Проверка завершена. Найдено новостей для публикации: ${scheduledNews.length}`);

            if (scheduledNews.length === 0) {
                // Проверим сколько всего отложенных новостей
                const allScheduled = await ScheduledNews.findAll({
                    where: { status: 'scheduled' }
                });
                logger.info(`📝 Всего отложенных новостей: ${allScheduled.length}`);
                
                if (allScheduled.length > 0) {
                    allScheduled.forEach(news => {
                        logger.info(`   - "${news.title}" на ${news.scheduledDate.toISOString()}`);
                    });
                }
                
                this.isRunning = false;
                return;
            }

            logger.info(`🚀 Найдено ${scheduledNews.length} новостей для публикации`);

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
            logger.info('✅ Проверка планировщика завершена');
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
                logger.info(`📎 Обрабатываю ${newsData.mediaFiles.length} медиа файлов...`);

                for (const mediaFile of newsData.mediaFiles) {
                    logger.info(`🔍 Обрабатываю файл: ${JSON.stringify(mediaFile, null, 2)}`);
                    
                    if (mediaFile.type === 'video' && mediaFile.url) {
                        const media = await Media.create({
                            url: mediaFile.url,
                            type: 'video'
                        }, { transaction });
                        mediaInstances.push(media);
                        logger.info(`✅ Видео добавлено: ${mediaFile.url}`);
                    } else if (mediaFile.type === 'image') {
                        if (mediaFile.url) {
                            // Файл уже имеет готовый URL
                            const media = await Media.create({
                                url: mediaFile.url,
                                type: 'image'
                            }, { transaction });
                            mediaInstances.push(media);
                            logger.info(`✅ Изображение добавлено по URL: ${mediaFile.url}`);
                        } else if (mediaFile.path && mediaFile.filename) {
                            // Файл находится во временной папке, нужно переместить
                            const tempPath = mediaFile.path;
                            const finalFilename = mediaFile.filename.replace(/^\d+-/, ''); // убираем timestamp префикс
                            const finalPath = path.join(__dirname, '../uploads/images', finalFilename);

                            logger.info(`📦 Перемещаю файл: ${tempPath} -> ${finalPath}`);

                            if (fs.existsSync(tempPath)) {
                                // Убеждаемся что папка uploads/images существует
                                const uploadsDir = path.join(__dirname, '../uploads/images');
                                if (!fs.existsSync(uploadsDir)) {
                                    fs.mkdirSync(uploadsDir, { recursive: true });
                                    logger.info(`📁 Создана папка: ${uploadsDir}`);
                                }

                                // Если финальный файл уже существует, создаем уникальное имя
                                let uniqueFinalPath = finalPath;
                                let counter = 1;
                                while (fs.existsSync(uniqueFinalPath)) {
                                    const fileExt = path.extname(finalFilename);
                                    const baseName = path.basename(finalFilename, fileExt);
                                    const uniqueFilename = `${baseName}-${counter}${fileExt}`;
                                    uniqueFinalPath = path.join(__dirname, '../uploads/images', uniqueFilename);
                                    counter++;
                                }

                                fs.renameSync(tempPath, uniqueFinalPath);
                                const finalUrl = `uploads/images/${path.basename(uniqueFinalPath)}`;

                                const media = await Media.create({
                                    url: finalUrl,
                                    type: 'image'
                                }, { transaction });
                                mediaInstances.push(media);
                                logger.info(`✅ Изображение перемещено и добавлено: ${finalUrl}`);
                            } else {
                                logger.warn(`❌ Временный файл не найден: ${tempPath}`);
                            }
                        } else {
                            logger.warn(`⚠️ Неполные данные файла: ${JSON.stringify(mediaFile)}`);
                        }
                    }
                }

                if (mediaInstances.length > 0) {
                    await news.addMediaFiles(mediaInstances, { transaction });
                    logger.info(`✅ Добавлено ${mediaInstances.length} медиа файлов к новости`);
                } else {
                    logger.warn(`⚠️ Не удалось добавить ни одного медиа файла`);
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

                            // Определяем путь к исходному файлу правильно
                            let sourcePath;
                            if (file.path && fs.existsSync(file.path)) {
                                // Файл загружен и находится по абсолютному пути
                                sourcePath = file.path;
                            } else if (file.filename) {
                                // Пробуем найти файл в папке uploads/images
                                sourcePath = path.join(__dirname, '../uploads/images', file.filename);
                            }
                            
                            if (sourcePath && fs.existsSync(sourcePath)) {
                                fs.copyFileSync(sourcePath, tempPath);
                                logger.info(`📁 Файл скопирован во временную папку: ${file.filename} -> ${tempFilename}`);
                                
                                return {
                                    type: 'image',
                                    filename: tempFilename,
                                    originalName: file.originalname || file.originalName,
                                    path: tempPath
                                };
                            } else {
                                logger.warn(`Исходный файл не найден: ${sourcePath}`);
                                // Если файл не найден, возвращаем URL напрямую (если есть)
                                if (file.url) {
                                    return {
                                        type: 'image',
                                        filename: file.filename,
                                        originalName: file.originalname || file.originalName,
                                        url: file.url
                                    };
                                }
                                
                                // Если ничего нет, пытаемся создать URL на основе filename
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
        // Очистка временных файлов каждую ночь в 2:00
        cron.schedule('0 2 * * *', () => {
            this.cleanupTempFiles();
        });

        // Очистка неиспользуемых медиа файлов каждую ночь в 3:00
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
                    logger.info(`Удален старый временный файл: ${file}`);
                }
            }
        } catch (error) {
            logger.error('Ошибка очистки временных файлов:', error);
        }
    }

    async cleanupOrphanedFiles() {
        try {
            logger.info('🧹 Начинаю очистку неиспользуемых медиа файлов...');
            
            const uploadsDir = path.join(__dirname, '../uploads/images');
            if (!fs.existsSync(uploadsDir)) {
                logger.info('Папка uploads/images не существует, пропускаем очистку');
                return;
            }

            // Получаем все файлы в папке uploads/images
            const files = fs.readdirSync(uploadsDir);
            logger.info(`Найдено файлов в uploads/images: ${files.length}`);

            // Получаем все URL из базы данных
            const mediaUrls = await Media.findAll({
                where: { type: 'image' },
                attributes: ['url']
            });

            const usedFilenames = mediaUrls.map(media => path.basename(media.url));
            logger.info(`Используемых файлов в БД: ${usedFilenames.length}`);

            let deletedCount = 0;
            let skippedCount = 0;

            for (const file of files) {
                if (!usedFilenames.includes(file)) {
                    const filePath = path.join(uploadsDir, file);
                    try {
                        await fs.promises.unlink(filePath);
                        deletedCount++;
                        logger.info(`🗑️ Удален неиспользуемый файл: ${file}`);
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
newsScheduler.initCleanup();

module.exports = newsScheduler;