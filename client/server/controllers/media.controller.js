const path = require('path');
const fs = require('fs');
const uploadDir =
    process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

const checkFileExists = (filePath) => {
    return fs.existsSync(filePath);
};

exports.getMediaFile = (req, res) => {
    const { type, filename } = req.params;

    if (!filename) {
        return res.status(400).json({ error: 'Имя файла не указано' });
    }

    const allowedTypes = ['images', 'videos'];
    if (!allowedTypes.includes(type)) {
        return res.status(400).json({ error: 'Недопустимый тип файла' });
    }

    const filePath = path.resolve(uploadDir, type, filename);

    if (!checkFileExists(filePath)) {
        return res.status(404).json({ error: 'Файл не найден' });
    }

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(500).json({ error: 'Ошибка при отправке файла' });
        }
    });
};
