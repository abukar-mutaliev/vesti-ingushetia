require("dotenv").config();
const helmet = require("helmet");
const https = require("https");
const logger = require("./logger");
const express = require("express");
const cookieParser = require("cookie-parser");
const { sequelize } = require("./models/index");
const router = require("./routes/index");
const cors = require("cors");
const path = require("path");
require("./middlewares/cronJobs");
const botBlocker = require("./middlewares/botBlocker");

const uploadDir =
  process.env.UPLOAD_DIR || path.resolve(__dirname, "..", "uploads");

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const imagesDir = path.join(uploadDir, "images");
const videosDir = path.join(uploadDir, "videos");
const audioDir = path.join(uploadDir, "audio");
const avatarDir = path.join(uploadDir, "avatars");

const app = express();
app.use(botBlocker);

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: corsOrigin,
  methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Authorization", "Content-Type", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "http://localhost:5173"],
        connectSrc: ["'self'", "http://localhost:5000"],
        imgSrc: ["'self'", "data:", "http://localhost:5000"],
        mediaSrc: ["'self'", "http://localhost:5000"],
        scriptSrc: ["'self'", "'unsafe-inline'", "http://localhost:5173"],
        styleSrc: ["'self'", "'unsafe-inline'", "http://localhost:5173"],
        fontSrc: ["'self'", "http://localhost:5000"],
      },
    },
    referrerPolicy: { policy: "no-referrer" },
    featurePolicy: {
      geolocation: ["'none'"],
    },
  })
);

const safePath = path.normalize(path.join(__dirname, "uploads"));
app.use("../uploads", (req, res, next) => {
  let filePath = path.join(__dirname, req.path);

  if (filePath.startsWith(safePath)) {
    return next();
  }
  return res.status(400).send("Invalid path");
});

app.use(
  "/uploads/images",
  express.static(imagesDir, {
    setHeaders: (res, path, stat) => {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);
app.use(
  "/uploads/videos",
  express.static(videosDir, {
    setHeaders: (res, path, stat) => {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);
app.use(
  "/uploads/audio",
  express.static(audioDir, {
    setHeaders: (res, path, stat) => {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);
app.use(
  "/uploads/avatars",
  express.static(avatarDir, {
    setHeaders: (res, path, stat) => {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);

app.use((req, res, next) => {
  logger.info(`Получен запрос: ${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  logger.error(`Ошибка: ${err.message}`);
  res.status(500).send("Произошла ошибка");
});

app.use("/api", router);

sequelize
  .sync()
  .then(() => {
    logger.info("Все модели были синхронизированы с базой данных.");
    app.listen(PORT, () => {
      logger.info(`Сервер запущен на порту ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(
      "Ошибка при синхронизации моделей с базой данных: " + err.message
    );
  });
