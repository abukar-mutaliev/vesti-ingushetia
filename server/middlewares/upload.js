const multer = require("multer");
const path = require("path");
require("dotenv").config();
const fs = require("fs");

const uploadDir = process.env.UPLOAD_DIR || "uploads";
const avatarsDir = path.join(uploadDir, "avatars");
const imagesDir = path.join(uploadDir, "images");
const videosDir = path.join(uploadDir, "videos");
const audioDir = path.join(uploadDir, "audio");

[uploadDir, avatarsDir, imagesDir, videosDir, audioDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const maxAvatarSize = parseInt(process.env.MAX_AVATAR_SIZE || "10485760", 10); // 10 MB

const fileDestination = (req, file, cb) => {
  const destMap = {
    avatar: avatarsDir,
    images: imagesDir,
    videos: videosDir,
    audio: audioDir,
  };

  const destination = destMap[file.fieldname];
  if (destination) {
    cb(null, destination);
  } else {
    cb(new Error("Неверное имя файла или тип файла"));
  }
};

const storage = multer.diskStorage({
  destination: fileDestination,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = (
    process.env.ALLOWED_FILE_TYPES || "jpeg,jpg,png,gif,mp4,mkv,webp"
  ).split(",");
  const ext = path.extname(file.originalname).toLowerCase().slice(1);

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Неверный тип файла: " + ext));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: maxAvatarSize },
  fileFilter,
}).fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 5 },
  { name: "avatar", maxCount: 1 },
  { name: "audio", maxCount: 5 },
]);

const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Ошибка Multer:", err);
    return res
      .status(400)
      .json({ error: `Ошибка загрузки файлов: ${err.message}` });
  } else if (err) {
    console.error("Ошибка загрузки файлов:", err);
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  upload,
  handleMulterErrors,
};
