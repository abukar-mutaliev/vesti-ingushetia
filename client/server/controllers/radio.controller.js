const { Radio } = require('../models');
const { posix } = require('path');
const path = require('path');
const baseUrl = process.env.BASE_URL;
const fs = require('fs').promises;
const { Op } = require('sequelize');

exports.createRadio = async (req, res) => {
    try {
        const { title, description } = req.body;
        const audioFile = req.file;

        if (!audioFile) {
            return res
                .status(400)
                .json({ error: 'Файл аудиозаписи обязателен' });
        }

        const audioUrl = posix.join('uploads', 'audio', audioFile.filename);

        const radio = await Radio.create({
            title,
            description,
            url: audioUrl,
        });

        res.status(201).json(radio);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.getAllRadios = async (req, res) => {
    try {
        const radio = await Radio.findAll();
        const modifiedRadios = radio.map((radio) => ({
            ...radio.toJSON(),
            url: `${baseUrl}/${radio.url}`,
        }));
        res.status(200).json(modifiedRadios);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.getRadioById = async (req, res) => {
    try {
        const { id } = req.params;
        const radio = await Radio.findByPk(id);

        if (!radio) {
            return res.status(404).json({ error: 'Аудиозапись не найдена' });
        }

        radio.url = `${baseUrl}/${radio.url}`;
        res.status(200).json(radio);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.updateRadio = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        const radio = await Radio.findByPk(id);
        if (!radio) {
            return res.status(404).json({ error: 'Аудиозапись не найдена' });
        }

        if (req.file) {
            if (radio.url) {
                const oldAudioPath = path.join(__dirname, '..', radio.url);
                try {
                    await fs.promises.unlink(oldAudioPath);
                } catch (err) {
                    console.error(
                        'Ошибка при удалении старого аудиофайла:',
                        err,
                    );
                }
            }

            const audioUrl = posix.join('uploads', 'audio', req.file.filename);
            radio.url = audioUrl;
        }
        radio.title = title || radio.title;
        radio.description = description || radio.description;

        await radio.save();

        res.status(200).json({
            ...radio.toJSON(),
            url: `${process.env.BASE_URL}/${radio.url}`,
        });
    } catch (error) {
        console.error('Ошибка обновления аудиозаписи:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

exports.deleteRadio = async (req, res) => {
    try {
        const { id } = req.params;
        const radio = await Radio.findByPk(id);

        if (!radio) {
            return res.status(404).json({ error: 'Аудиозапись не найдена' });
        }

        if (radio.url) {
            const audioPath = path.join(__dirname, '..', radio.url);
            try {
                await fs.unlink(audioPath);
            } catch (err) {
                console.error('Ошибка при удалении аудиофайла:', err);
            }
        }

        await radio.destroy();
        res.status(200).json({ message: 'Аудиозапись успешно удалена' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};
