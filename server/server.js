require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { sequelize } = require("./models/index");
const router = require("./routes/index");
const cors = require("cors");
const path = require("path");

const uploadDir = process.env.UPLOAD_DIR || "uploads";
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const imagesDir = path.join(uploadDir, "images");
const videosDir = path.join(uploadDir, "videos");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.options("/api/users/update-avatar", cors());

app.use("/uploads", express.static(path.join(__dirname, uploadDir)));
app.use("/uploads/images", express.static(path.join(__dirname, imagesDir)));
app.use("/uploads/videos", express.static(path.join(__dirname, videosDir)));

app.use("/api", router);

sequelize
  .sync()
  .then(() => {
    console.log("Все модели были синхронизированы с базой данных.");
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Ошибка при синхронизации моделей с базой данных:", err);
  });
