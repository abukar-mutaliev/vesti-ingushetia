const multer = require('multer');
const path = require('path');
require('dotenv').config();
const fs = require('fs');

const uploadDir =
    process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const electionsDir = path.join(uploadDir, 'elections');

if (!fs.existsSync(electionsDir)) {
    fs.mkdirSync(electionsDir, { recursive: true });
}

const maxPdfSize = process.env.MAX_PDF_SIZE || 50 * 1024 * 1024;

const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, electionsDir);
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

const pdfFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext === '.pdf' && file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Неверный тип файла. Поддерживается только формат PDF',
            ),
        );
    }
};

const uploadPdfMiddleware = multer({
    storage: pdfStorage,
    limits: { fileSize: maxPdfSize },
    fileFilter: pdfFileFilter,
}).single('pdf');

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
    uploadPdf: uploadPdfMiddleware,
    handleMulterErrors,
};
