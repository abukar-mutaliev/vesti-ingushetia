const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const path = require("path");
const { Comment } = require("../models");
const { Op } = require("sequelize");
require("dotenv").config();
const fs = require("fs");
require("dotenv").config();
const JWT_SECRET = process.env.SECRET_KEY;
const BASE_URL = process.env.BASE_URL;

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    const usersWithFullAvatarUrl = users.map((user) => ({
      ...user.toJSON(),
      avatarUrl: user.avatarUrl ? `${BASE_URL}/${user.avatarUrl}` : null,
    }));
    res.json(usersWithFullAvatarUrl);
  } catch (err) {
    res.status(500).json({ error: `Ошибка получения пользователей: ${err}` });
  }
};

exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  let avatarUrl = null;

  if (req.file) {
    avatarUrl = path.posix.join("uploads", "avatars", req.file.filename);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatarUrl,
    });

    res.status(201).json({
      ...user.toJSON(),
      avatarUrl: avatarUrl ? `${BASE_URL}/${avatarUrl}` : null,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: `Ошибка создания пользователя: ${err.message}` });
  }
};

exports.registerAdmin = async (req, res) => {
  const { username, email, password } = req.body;
  const { user } = req;

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Имя пользователя уже занято." });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: "Email уже используется." });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        error:
          "Доступ запрещен. Только администратор может регистрировать других администраторов.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      username,
      email,
      password: hashedPassword,
      isAdmin: true,
    });
    res.status(201).json({ message: "Админ успешно зарегистрирован", admin });
  } catch (err) {
    res
      .status(500)
      .json({ error: `Ошибка регистрации админа: ${err.message}` });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Неверное имя пользователя" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Неверный пароль" });
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "30m" }
    );

    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Успешная авторизация",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    res.status(500).json({ error: `Ошибка авторизации: ${err.message}` });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(403).json({ error: "Refresh token отсутствует" });
  }

  try {
    jwt.verify(refreshToken, JWT_SECRET, async (err, user) => {
      if (err)
        return res
          .status(403)
          .json({ error: "Недействительный refresh token" });

      const dbUser = await User.findByPk(user.id);

      if (!dbUser) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      const newAccessToken = jwt.sign(
        {
          id: dbUser.id,
          username: dbUser.username,
          isAdmin: dbUser.isAdmin,
        },
        JWT_SECRET,
        { expiresIn: "30m" }
      );

      const newRefreshToken = jwt.sign({ id: dbUser.id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("auth_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 60 * 1000,
      });

      res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: "Токен обновлен",
        accessToken: newAccessToken,
        user: {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          isAdmin: dbUser.isAdmin,
        },
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Ошибка обновления токена: ${err.message}` });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;
  let avatarUrl;

  if (req.file) {
    avatarUrl = `${BASE_URL}/${path.posix.join(
      "uploads",
      "avatars",
      req.file.filename
    )}`;
  }

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    await user.update({
      username: username || user.username,
      email: email || user.email,
      avatarUrl: avatarUrl || user.avatarUrl,
    });

    res.status(200).json({
      ...user.toJSON(),
      avatarUrl: user.avatarUrl ? `${BASE_URL}/${user.avatarUrl}` : null,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: `Ошибка обновления пользователя: ${err.message}` });
  }
};

exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { isAdmin } = req.body;
  const requestingUser = req.user;

  try {
    if (!requestingUser.isAdmin) {
      return res.status(403).json({
        error:
          "Доступ запрещен. Только администраторы могут изменять роли пользователей.",
      });
    }

    if (parseInt(id) === requestingUser.id) {
      return res
        .status(400)
        .json({ error: "Вы не можете изменять свою собственную роль." });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден." });
    }

    user.isAdmin = isAdmin;
    await user.save();

    res
      .status(200)
      .json({ message: "Роль пользователя успешно обновлена.", user });
  } catch (err) {
    res
      .status(500)
      .json({ error: `Ошибка обновления роли пользователя: ${err.message}` });
  }
};

exports.updateAvatar = async (req, res) => {
  const userId = req.user.id;
  let avatarUrl;

  if (req.files && req.files.avatar) {
    avatarUrl = path.posix.join(
      "uploads",
      "avatars",
      req.files.avatar[0].filename
    );
  } else {
    return res
      .status(400)
      .json({ error: "Необходимо предоставить файл аватара" });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    if (user.avatarUrl) {
      const oldAvatarPath = path.join(
        __dirname,
        "..",
        "../uploads",
        "avatars",
        user.avatarUrl.replace("uploads/avatars/", "")
      );

      fs.exists(oldAvatarPath, (exists) => {
        if (exists) {
          fs.unlink(oldAvatarPath, (err) => {
            if (err) {
              console.error("Ошибка при удалении старого аватара:", err);
            }
          });
        } else {
          console.log("Файл не существует:", oldAvatarPath);
        }
      });
    }

    await user.update({ avatarUrl });

    res.status(200).json({
      ...user.toJSON(),
      avatarUrl: `${BASE_URL}/${avatarUrl}`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: `Ошибка обновления аватара: ${err.message}` });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "username",
        "email",
        "createdAt",
        "avatarUrl",
        "isAdmin",
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({
      ...user.toJSON(),
      avatarUrl: user.avatarUrl ? `${BASE_URL}/${user.avatarUrl}` : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Ошибка получения профиля пользователя" });
  }
};

exports.getUserReplies = async (req, res) => {
  const userId = req.user.id;

  try {
    const userComments = await Comment.findAll({
      where: { userId },
      attributes: ["id"],
    });

    if (userComments.length === 0) {
      return res.status(200).json({ replies: [] });
    }

    const commentIds = userComments.map((comment) => comment.id);

    const replies = await Comment.findAll({
      where: {
        parentCommentId: {
          [Op.in]: commentIds,
        },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "avatarUrl"],
        },
      ],
    });

    res.status(200).json({ replies });
  } catch (err) {
    console.error("Error retrieving user replies:", err);
    res.status(500).json({ error: `Ошибка получения ответов: ${err.message}` });
  }
};

exports.logOutUser = (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Вы вышли из системы" });
};
