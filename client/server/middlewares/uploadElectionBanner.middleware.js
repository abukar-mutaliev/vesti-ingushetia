const multer = require('multer');
const path = require('path');
require('dotenv').config();
const fs = require('fs');

const uploadDir =
    process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const bannerDir = path.join(uploadDir, 'elections', 'banners');

if (!fs.existsSync(bannerDir)) {
    fs.mkdirSync(bannerDir, { recursive: true });
}

const maxImageSize = process.env.MAX_IMAGE_SIZE || 10 * 1024 * 1024;

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

const bannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, bannerDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                '-' +
                uniqueSuffix +
                path.extname(file.originalname),
        );
    },
});

const bannerFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
        allowedMimeTypes.includes(file.mimetype) &&
        (ext === '.jpg' || ext === '.jpeg' || ext === '.png')
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Неверный тип файла. Поддерживаются только JPG и PNG',
            ),
        );
    }
};

const uploadBannerMiddleware = multer({
    storage: bannerStorage,
    limits: { fileSize: maxImageSize },
    fileFilter: bannerFileFilter,
}).single('banner');

const handleMulterErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res
            .status(400)
            .json({ error: `Ошибка загрузки файла: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

module.exports = {
    uploadBanner: uploadBannerMiddleware,
    handleMulterErrors,
};
