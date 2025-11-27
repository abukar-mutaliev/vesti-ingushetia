// routes/scheduledNews.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../middlewares/auth.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');
const newsScheduler = require('../schedulers/newsScheduler');
const { ScheduledNews } = require('../models');
const logger = require('../logger');

// Получить все отложенные новости пользователя
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const scheduledNews = await newsScheduler.getScheduledNews(req.user.id);
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

        const formattedNews = scheduledNews.map(item => {
            const newsData = JSON.parse(item.newsData);
            
            // Форматируем URL изображений
            let mediaFiles = [];
            if (newsData.mediaFiles && newsData.mediaFiles.length > 0) {
                console.log('📷 Обработка mediaFiles для новости:', item.title);
                
                mediaFiles = newsData.mediaFiles.map((media, index) => {
                    console.log(`  Файл ${index + 1}:`, media);
                    
                    let url = '';
                    
                    // Приоритеты для формирования URL:
                    // 1. Если уже есть готовый URL (http/https)
                    if (media.url && media.url.startsWith('http')) {
                        url = media.url;
                    }
                    // 2. Если filename начинается с scheduled- (файлы в temp)
                    else if (media.filename && media.filename.startsWith('scheduled-')) {
                        url = `${baseUrl}/uploads/temp/${media.filename}`;
                    }
                    // 3. Если есть filename обычный - формируем URL для uploads/images
                    else if (media.filename) {
                        url = `${baseUrl}/uploads/images/${media.filename}`;
                    }
                    // 4. Если путь содержит temp
                    else if (media.path && media.path.includes('temp')) {
                        const filename = media.path.split(/[/\\]/).pop();
                        url = `${baseUrl}/uploads/temp/${filename}`;
                    }
                    // 5. Если путь содержит uploads
                    else if (media.path && media.path.includes('uploads')) {
                        const uploadsIndex = media.path.indexOf('uploads');
                        const relativePath = media.path.substring(uploadsIndex).replace(/\\/g, '/');
                        url = `${baseUrl}/${relativePath}`;
                    }
                    // 6. Если есть относительный путь uploads/
                    else if (media.url && media.url.startsWith('uploads/')) {
                        url = `${baseUrl}/${media.url}`;
                    }
                    
                    console.log(`  Итоговый URL: ${url}`);
                    
                    return {
                        ...media,
                        url: url
                    };
                }).filter(m => m.url); // Фильтруем только с валидным URL
            }
            
            return {
                id: item.id,
                title: item.title,
                content: newsData.content || '',
                scheduledDate: item.scheduledDate,
                publishDate: item.scheduledDate,
                status: item.status,
                createdAt: item.createdAt,
                authorId: item.authorId,
                // Полные данные для редактирования
                categoryIds: newsData.categoryIds || [],
                videoUrl: newsData.videoUrl || '',
                mediaFiles: mediaFiles,
                preview: {
                    title: newsData.title,
                    content: newsData.content ? newsData.content.substring(0, 200) + '...' : '',
                    categories: newsData.categoryIds || [],
                    hasMedia: (newsData.mediaFiles && newsData.mediaFiles.length > 0),
                    hasVideo: newsData.videoUrl ? true : false
                },
                errorMessage: item.errorMessage,
                lastAttempt: item.lastAttempt
            };
        });

        res.json(formattedNews);
    } catch (error) {
        logger.error('Ошибка получения отложенных новостей:', error);
        res.status(500).json({
            error: 'Ошибка получения отложенных новостей'
        });
    }
});

// Получить все отложенные новости (только для админов)
router.get('/all', authenticateAdmin, async (req, res) => {
    try {
        const scheduledNews = await newsScheduler.getScheduledNews();

        const formattedNews = scheduledNews.map(item => {
            const newsData = JSON.parse(item.newsData);
            return {
                id: item.id,
                title: item.title,
                content: newsData.content || '',
                scheduledDate: item.scheduledDate,
                publishDate: item.scheduledDate,
                status: item.status,
                authorId: item.authorId,
                createdAt: item.createdAt,
                preview: {
                    title: newsData.title,
                    content: newsData.content ? newsData.content.substring(0, 200) + '...' : '',
                },
                errorMessage: item.errorMessage,
                lastAttempt: item.lastAttempt
            };
        });

        res.json(formattedNews);
    } catch (error) {
        logger.error('Ошибка получения всех отложенных новостей:', error);
        res.status(500).json({
            error: 'Ошибка получения отложенных новостей'
        });
    }
});

// Отменить отложенную новость
router.delete('/:id', authenticateToken, csrfProtection, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await newsScheduler.cancelScheduledNews(id, userId);

        logger.info(`Пользователь ${userId} отменил отложенную новость ${id}`);

        res.json({
            message: 'Отложенная новость успешно отменена'
        });
    } catch (error) {
        logger.error('Ошибка отмены отложенной новости:', error);
        res.status(400).json({
            error: error.message || 'Ошибка отмены отложенной новости'
        });
    }
});

// Немедленно опубликовать отложенную новость
router.post('/:id/publish-now', authenticateToken, csrfProtection, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const scheduled = await ScheduledNews.findOne({
            where: {
                id,
                authorId: userId,
                status: 'scheduled'
            }
        });

        if (!scheduled) {
            return res.status(404).json({
                error: 'Отложенная новость не найдена'
            });
        }

        // Принудительно публикуем новость
        await newsScheduler.publishScheduledNews(scheduled);

        logger.info(`Пользователь ${userId} немедленно опубликовал отложенную новость ${id}`);

        res.json({
            message: 'Новость успешно опубликована'
        });
    } catch (error) {
        logger.error('Ошибка немедленной публикации:', error);
        res.status(500).json({
            error: 'Ошибка публикации новости'
        });
    }
});

// Получить статистику планировщика (только для админов)
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const stats = await ScheduledNews.findAll({
            attributes: [
                'status',
                [ScheduledNews.sequelize.fn('COUNT', '*'), 'count']
            ],
            group: ['status']
        });

        const formattedStats = stats.reduce((acc, stat) => {
            acc[stat.status] = parseInt(stat.get('count'));
            return acc;
        }, {});

        // Добавляем информацию о ближайших публикациях
        const upcoming = await ScheduledNews.findAll({
            where: {
                status: 'scheduled',
                scheduledDate: {
                    [require('sequelize').Op.gte]: new Date()
                }
            },
            order: [['scheduledDate', 'ASC']],
            limit: 5,
            attributes: ['id', 'title', 'scheduledDate', 'authorId']
        });

        res.json({
            stats: formattedStats,
            upcoming: upcoming.map(item => ({
                id: item.id,
                title: item.title,
                scheduledDate: item.scheduledDate,
                authorId: item.authorId
            })),
            schedulerRunning: true
        });
    } catch (error) {
        logger.error('Ошибка получения статистики планировщика:', error);
        res.status(500).json({
            error: 'Ошибка получения статистики'
        });
    }
});

module.exports = router;