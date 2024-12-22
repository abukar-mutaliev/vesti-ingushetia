const { VideoAd } = require('../models');
const path = require('path');
const { unlink } = require('fs');
const { Op } = require('sequelize');
const baseUrl = process.env.BASE_URL;

exports.createVideoAd = async (req, res) => {
    try {
        const { title, description, expirationDate } = req.body;
        const videoFile = req.file;

        const videoUrl = path.posix.join(
            'uploads',
            'videoAd',
            videoFile.filename,
        );

        const videoAd = await VideoAd.create({
            title,
            description,
            url: videoUrl,
            expirationDate,
        });

        res.status(201).json(videoAd);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.getAllActiveVideoAds = async (req, res) => {
    try {
        const videoAds = await VideoAd.findAll({
            where: {
                status: 'active',
                expirationDate: {
                    [Op.gt]: new Date(),
                },
            },
            order: [['createdAt', 'DESC']],
        });

        const modifiedVideoAds = videoAds.map((ad) => ({
            ...ad.toJSON(),
            url: `${baseUrl}/${ad.url}`,
        }));

        res.status(200).json(modifiedVideoAds);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.getVideoAds = async (req, res) => {
    try {
        const { status } = req.query;
        const whereClause = {};

        if (status) {
            whereClause.status = status;
        }

        const videoAds = await VideoAd.findAll({
            where: {
                ...whereClause,
                expirationDate: {
                    [Op.gt]: new Date(),
                },
            },
            order: [['createdAt', 'DESC']],
        });

        const modifiedVideoAds = videoAds.map((ad) => ({
            ...ad.toJSON(),
            url: `${baseUrl}/${ad.url}`,
        }));

        res.status(200).json(modifiedVideoAds);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.getVideoAdById = async (req, res) => {
    try {
        const { id } = req.params;
        const videoAd = await VideoAd.findByPk(id);

        if (!videoAd) {
            return res.status(404).json({ error: 'Видеореклама не найдена' });
        }

        videoAd.url = `${baseUrl}/${videoAd.url}`;
        res.status(200).json(videoAd);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.updateVideoAd = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, expirationDate, status } = req.body;

        const videoAd = await VideoAd.findByPk(id);
        if (!videoAd) {
            return res.status(404).json({ error: 'Видеореклама не найдена' });
        }

        if (req.file) {
            const oldVideoPath = path.join(
                __dirname,
                '..',
                'uploads',
                videoAd.url,
            );
            unlink(oldVideoPath, (err) => {
                if (err) {
                    console.error('Ошибка удаления старого видео:', err);
                }
            });

            const videoUrl = path.posix.join(
                'uploads',
                'videoAd',
                req.file.filename,
            );
            videoAd.url = videoUrl;
        }

        videoAd.title = title || videoAd.title;
        videoAd.description = description || videoAd.description;
        videoAd.expirationDate = expirationDate || videoAd.expirationDate;
        videoAd.status = status || videoAd.status;

        await videoAd.save();
        res.status(200).json(videoAd);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.deleteVideoAd = async (req, res) => {
    try {
        const { id } = req.params;
        const videoAd = await VideoAd.findByPk(id);

        if (!videoAd) {
            return res.status(404).json({ error: 'Видеореклама не найдена' });
        }

        await videoAd.destroy();
        res.status(200).json({ message: 'Видеореклама успешно удалена' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.pauseVideoAd = async (req, res) => {
    try {
        const { id } = req.params;
        const videoAd = await VideoAd.findByPk(id);

        if (!videoAd) {
            return res.status(404).json({ error: 'Видеореклама не найдена' });
        }

        videoAd.status = 'paused';
        await videoAd.save();

        res.status(200).json({
            message: 'Видеореклама приостановлена',
            videoAd,
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.activeVideoAd = async (req, res) => {
    try {
        const { id } = req.params;
        const videoAd = await VideoAd.findByPk(id);

        if (!videoAd) {
            return res.status(404).json({ error: 'Видеореклама не найдена' });
        }

        videoAd.status = 'active';
        await videoAd.save();

        res.status(200).json({ message: 'Видеореклама возобновлена', videoAd });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};
