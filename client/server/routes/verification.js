const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/yandex_*.html', (req, res) => {
    const filename = req.path.substring(1); // Убираем слеш из пути
    const verificationFilePath = path.join(__dirname, '..', 'verification', filename);

    if (fs.existsSync(verificationFilePath)) {
        res.sendFile(verificationFilePath);
    } else {
        res.status(404).send('Файл верификации не найден');
    }
});

module.exports = router;
