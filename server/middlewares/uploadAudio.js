const multer = require("multer");
const path = require("path");
require("dotenv").config();
const fs = require("fs");

// Используем абсолютный путь к папке uploads в корне проекта
const uploadDir =
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
const audioDir = path.join(uploadDir, "audio");

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const maxAudioSize = process.env.MAX_AUDIO_SIZE || 50 * 1024 * 1024;

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDir); // Сохраняем в папку audio внутри папки uploads
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const audioFileFilter = (req, file, cb) => {
  const allowedTypes = ["mp3", "wav", "ogg"];
  const ext = path.extname(file.originalname).toLowerCase().slice(1);

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Неверный тип файла. Поддерживаются только mp3, wav, ogg"));
  }
};

const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: maxAudioSize },
  fileFilter: audioFileFilter,
}).single("audio");

const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ error: `Ошибка загрузки файлов: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  uploadAudio,
  handleMulterErrors,
};
