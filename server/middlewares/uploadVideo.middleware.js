const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const uploadDir = process.env.UPLOAD_DIR || "uploads";
const videoDir = path.join(uploadDir, "videoAd");

if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}
const maxVideoSize = process.env.MAX_VIDEO_SIZE || 100 * 1024 * 1024; // 100MB по умолчанию

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const videoFileFilter = (req, file, cb) => {
  const allowedTypes = ["mp4", "avi", "mov", "mkv"];
  const ext = path.extname(file.originalname).toLowerCase().slice(1);

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error("Неверный тип файла. Поддерживаются только mp4, avi, mov, mkv")
    );
  }
};

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: maxVideoSize },
  fileFilter: videoFileFilter,
}).single("video");

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
  uploadVideo,
  handleMulterErrors,
};
