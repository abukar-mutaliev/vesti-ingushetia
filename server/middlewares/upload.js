const multer = require("multer");
const path = require("path");
require("dotenv").config();

const uploadDir = process.env.UPLOAD_DIR || "uploads";
const avatarsDir = path.join(uploadDir, "avatars");
const imagesDir = path.join(uploadDir, "images");
const videosDir = path.join(uploadDir, "videos");
const maxImageSize = process.env.MAX_IMAGE_SIZE; // 10 MB
const maxAvatarSize = process.env.MAX_AVATAR_SIZE; // 10 MB
const maxVideoSize = process.env.MAX_VIDEO_SIZE; // 200 MB

const fileDestination = (req, file, cb) => {
  if (file.fieldname === "avatar") {
    cb(null, avatarsDir);
  } else if (file.mimetype.startsWith("image")) {
    cb(null, imagesDir);
  } else if (file.mimetype.startsWith("video")) {
    cb(null, videosDir);
  } else {
    cb(new Error("Неверный тип файла"));
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
    cb(
      new Error(
        "Неверный тип файла. Поддерживаются только: " + allowedTypes.join(", ")
      )
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, maxImageSize);
      } else if (file.mimetype.startsWith("avatar/")) {
        cb(null, maxAvatarSize);
      } else if (file.mimetype.startsWith("video/")) {
        cb(null, maxVideoSize);
      } else {
        cb(new Error("Неподдерживаемый тип файла"), false);
      }
    },
    fileFilter,
  },
}).fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 5 },
  { name: "avatar", maxCount: 10 },
]);

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
  upload,
  handleMulterErrors,
};
