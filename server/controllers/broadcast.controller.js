const { Broadcast } = require("../models");
const { posix } = require("path");
const path = require("path");
const baseUrl = process.env.BASE_URL;
const fs = require("fs").promises;
const { Op } = require("sequelize");

exports.createBroadcast = async (req, res) => {
  try {
    const { title, description } = req.body;
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({ error: "Файл аудиозаписи обязателен" });
    }

    const audioUrl = posix.join("uploads", "audio", audioFile.filename);

    const broadcast = await Broadcast.create({
      title,
      description,
      url: audioUrl,
    });

    res.status(201).json(broadcast);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера: " + error.message });
  }
};

exports.getAllBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.findAll();
    const modifiedBroadcasts = broadcasts.map((broadcast) => ({
      ...broadcast.toJSON(),
      url: `${baseUrl}/${broadcast.url}`,
    }));
    res.status(200).json(modifiedBroadcasts);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера: " + error.message });
  }
};

exports.getBroadcastById = async (req, res) => {
  try {
    const { id } = req.params;
    const broadcast = await Broadcast.findByPk(id);

    if (!broadcast) {
      return res.status(404).json({ error: "Аудиозапись не найдена" });
    }

    broadcast.url = `${baseUrl}/${broadcast.url}`;
    res.status(200).json(broadcast);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера: " + error.message });
  }
};
exports.updateBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const broadcast = await Broadcast.findByPk(id);
    if (!broadcast) {
      return res.status(404).json({ error: "Аудиозапись не найдена" });
    }

    if (req.file) {
      if (broadcast.url) {
        const oldAudioPath = path.join(__dirname, "..", broadcast.url);
        try {
          await fs.promises.unlink(oldAudioPath);
        } catch (err) {
          console.error("Ошибка при удалении старого аудиофайла:", err);
        }
      }

      const audioUrl = posix.join("uploads", "audio", req.file.filename);
      broadcast.url = audioUrl;
    }
    broadcast.title = title || broadcast.title;
    broadcast.description = description || broadcast.description;

    await broadcast.save();

    res.status(200).json({
      ...broadcast.toJSON(),
      url: `${process.env.BASE_URL}/${broadcast.url}`,
    });
  } catch (error) {
    console.error("Ошибка обновления аудиозаписи:", error);
    res.status(500).json({ error: "Ошибка сервера: " + error.message });
  }
};

exports.deleteBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const broadcast = await Broadcast.findByPk(id);

    if (!broadcast) {
      return res.status(404).json({ error: "Аудиозапись не найдена" });
    }

    if (broadcast.url) {
      const audioPath = path.join(__dirname, "..", broadcast.url);
      try {
        await fs.unlink(audioPath);
      } catch (err) {
        console.error("Ошибка при удалении аудиофайла:", err);
      }
    }

    await broadcast.destroy();
    res.status(200).json({ message: "Аудиозапись успешно удалена" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера: " + error.message });
  }
};
