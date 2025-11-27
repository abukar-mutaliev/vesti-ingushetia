const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const path = require('path');
const { Comment } = require('../models');
const { Op } = require('sequelize');
require('dotenv').config();
const fs = require('fs');
const JWT_SECRET = process.env.SECRET_KEY;
const BASE_URL = process.env.BASE_URL;
const logger = require('../logger');
const { validationResult } = require('express-validator');

const SAFE_USER_ATTRIBUTES = ['id', 'username', 'avatarUrl', 'createdAt'];
const ADMIN_USER_ATTRIBUTES = ['id', 'username', 'email', 'avatarUrl', 'isAdmin', 'createdAt', 'updatedAt'];
const FORBIDDEN_USER_FIELDS = ['password', 'passwordHash', 'resetToken', 'refreshToken'];


const sanitizeUserData = (user, isAdmin = false) => {
    if (!user) return null;

    const userObj = user.toJSON ? user.toJSON() : user;
    const allowedFields = isAdmin ? ADMIN_USER_ATTRIBUTES : SAFE_USER_ATTRIBUTES;

    const sanitized = {};
    allowedFields.forEach(field => {
        if (userObj.hasOwnProperty(field)) {
            sanitized[field] = userObj[field];
        }
    });

    FORBIDDEN_USER_FIELDS.forEach(field => {
        delete sanitized[field];
    });

    if (sanitized.avatarUrl) {
        sanitized.avatarUrl = sanitized.avatarUrl.startsWith('http')
            ? sanitized.avatarUrl
            : `${BASE_URL}/${sanitized.avatarUrl}`;
    }

    return sanitized;
};

exports.getAllUsers = async (req, res) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            logger.warn(`Попытка неавторизованного доступа к списку пользователей`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id || 'anonymous',
                timestamp: new Date().toISOString()
            });

            return res.status(403).json({
                error: 'Доступ запрещен. Требуются права администратора.'
            });
        }

        const users = await User.findAll({
            attributes: ADMIN_USER_ATTRIBUTES,
            order: [['createdAt', 'DESC']]
        });

        const sanitizedUsers = users.map(user => sanitizeUserData(user, true));

        logger.info(`Администратор ${req.user.id} получил список пользователей`, {
            timestamp: new Date().toISOString(),
            usersCount: sanitizedUsers.length,
            ip: req.ip
        });

        res.json(sanitizedUsers);
    } catch (err) {
        logger.error('Ошибка получения пользователей:', err);
        res.status(500).json({
            error: `Ошибка получения пользователей: ${err.message}`,
        });
    }
};

exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    let avatarUrl = null;

    if (req.file) {
        avatarUrl = path.posix.join('uploads', 'avatars', req.file.filename);
    }

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res
                .status(400)
                .json({ error: 'Пользователь с таким email уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            avatarUrl,
        });

        const sanitizedUser = sanitizeUserData(user, false);

        logger.info(`Зарегистрирован новый пользователь: ${username}`, {
            userId: user.id,
            email: email,
            timestamp: new Date().toISOString()
        });

        res.status(201).json(sanitizedUser);
    } catch (err) {
        logger.error('Ошибка регистрации пользователя:', err);
        res.status(500).json({
            error: `Ошибка создания пользователя: ${err.message}`,
        });
    }
};

exports.registerAdmin = async (req, res) => {
    const { username, email, password } = req.body;
    const { user } = req;

    try {
        if (!user.isAdmin) {
            logger.warn(`Попытка регистрации админа неадминистратором`, {
                userId: user.id,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });

            return res.status(403).json({
                error: 'Доступ запрещен. Только администратор может регистрировать других администраторов.',
            });
        }

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res
                .status(400)
                .json({ error: 'Имя пользователя уже занято.' });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email уже используется.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await User.create({
            username,
            email,
            password: hashedPassword,
            isAdmin: true,
        });

        const sanitizedAdmin = sanitizeUserData(admin, true);

        logger.info(`Администратор ${user.id} зарегистрировал нового админа ${admin.id}`, {
            newAdminUsername: username,
            timestamp: new Date().toISOString()
        });

        res.status(201).json({
            message: 'Админ успешно зарегистрирован',
            admin: sanitizedAdmin,
        });
    } catch (err) {
        logger.error('Ошибка регистрации админа:', err);
        res.status(500).json({
            error: `Ошибка регистрации админа: ${err.message}`,
        });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        logger.info('Ошибка валидации при входе:', validationErrors);
        return res.status(400).json({ errors: validationErrors.array() });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            logger.warn(`Попытка входа с несуществующим email: ${email}`, {
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            return res.status(401).json({ errors: [{ msg: 'Неверный email' }] });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            logger.warn(`Неудачная попытка входа для пользователя ${user.id}`, {
                email: email,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            return res.status(401).json({ errors: [{ msg: 'Неверный пароль' }] });
        }

        const accessToken = jwt.sign(
            {
                id: user.id,
                username: user.username,
                isAdmin: user.isAdmin,
            },
            JWT_SECRET,
            { expiresIn: '30m' }
        );

        const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie('auth_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 60 * 1000,
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie('csrf-token', req.csrfToken(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
        };

        logger.info(`Успешный вход пользователя ${user.id}`, {
            username: user.username,
            timestamp: new Date().toISOString()
        });

        res.json({
            message: 'Успешная авторизация',
            user: userResponse,
        });
    } catch (err) {
        logger.error('Ошибка входа:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            return res.status(403).json({ error: 'Refresh token отсутствует' });
        }

        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        const dbUser = await User.findByPk(decoded.id, {
            attributes: ['id', 'username', 'email', 'isAdmin']
        });

        if (!dbUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const newAccessToken = jwt.sign(
            {
                id: dbUser.id,
                username: dbUser.username,
                isAdmin: dbUser.isAdmin,
            },
            JWT_SECRET,
            { expiresIn: '30m' }
        );

        const newRefreshToken = jwt.sign({ id: dbUser.id }, JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie('auth_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 60 * 1000,
        });

        res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const userResponse = {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            isAdmin: dbUser.isAdmin,
        };

        res.json({
            message: 'Токен обновлен',
            accessToken: newAccessToken,
            user: userResponse,
        });
    } catch (err) {
        logger.error('Ошибка обновления токена:', err);
        return res.status(500).json({ error: `Ошибка обновления токена: ${err.message}` });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;
    let avatarUrl;

    try {
        if (req.user.id !== parseInt(id) && !req.user.isAdmin) {
            logger.warn(`Попытка изменения чужого профиля`, {
                requesterId: req.user.id,
                targetUserId: id,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });

            return res.status(403).json({
                error: 'Доступ запрещен. Вы можете редактировать только свой профиль.'
            });
        }

        if (req.file) {
            avatarUrl = path.posix.join('uploads', 'avatars', req.file.filename);
        }

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        await user.update({
            username: username || user.username,
            email: email || user.email,
            avatarUrl: avatarUrl || user.avatarUrl,
        });

        const sanitizedUser = sanitizeUserData(user, req.user.isAdmin);

        logger.info(`Обновлен профиль пользователя ${id}`, {
            updatedBy: req.user.id,
            timestamp: new Date().toISOString()
        });

        res.status(200).json(sanitizedUser);
    } catch (err) {
        logger.error('Ошибка обновления пользователя:', err);
        res.status(500).json({
            error: `Ошибка обновления пользователя: ${err.message}`,
        });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { isAdmin } = req.body;
    const requestingUser = req.user;

    try {
        if (!requestingUser.isAdmin) {
            logger.warn(`Попытка изменения роли неадминистратором`, {
                requesterId: requestingUser.id,
                targetUserId: id,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });

            return res.status(403).json({
                error: 'Доступ запрещен. Только администраторы могут изменять роли пользователей.',
            });
        }

        if (parseInt(id) === requestingUser.id) {
            return res.status(400).json({
                error: 'Вы не можете изменять свою собственную роль.',
            });
        }

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }

        user.isAdmin = isAdmin;
        await user.save();

        const sanitizedUser = sanitizeUserData(user, true);

        logger.info(`Изменена роль пользователя ${id}`, {
            changedBy: requestingUser.id,
            newRole: isAdmin ? 'admin' : 'user',
            timestamp: new Date().toISOString()
        });

        res.status(200).json({
            message: 'Роль пользователя успешно обновлена.',
            user: sanitizedUser,
        });
    } catch (err) {
        logger.error('Ошибка обновления роли:', err);
        res.status(500).json({
            error: `Ошибка обновления роли пользователя: ${err.message}`,
        });
    }
};

exports.updateAvatar = async (req, res) => {
    const userId = req.user.id;
    let avatarUrl;

    if (req.files && req.files.avatar) {
        avatarUrl = path.posix.join(
            'uploads',
            'avatars',
            req.files.avatar[0].filename,
        );
    } else {
        return res
            .status(400)
            .json({ error: 'Необходимо предоставить файл аватара' });
    }

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        if (user.avatarUrl) {
            const oldAvatarPath = path.join(
                __dirname,
                '..',
                '../uploads',
                'avatars',
                user.avatarUrl.replace('uploads/avatars/', ''),
            );

            fs.access(oldAvatarPath, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(oldAvatarPath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Ошибка при удалении старого аватара:', unlinkErr);
                        }
                    });
                }
            });
        }

        await user.update({ avatarUrl });

        const sanitizedUser = sanitizeUserData(user, user.isAdmin);

        res.status(200).json(sanitizedUser);
    } catch (err) {
        logger.error('Ошибка обновления аватара:', err);
        res.status(500).json({
            error: `Ошибка обновления аватара: ${err.message}`,
        });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'email', 'createdAt', 'avatarUrl', 'isAdmin']
        });

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const sanitizedUser = sanitizeUserData(user, user.isAdmin);

        res.json(sanitizedUser);
    } catch (err) {
        logger.error('Ошибка получения профиля:', err);
        res.status(500).json({
            error: 'Ошибка получения профиля пользователя',
        });
    }
};

exports.getUserReplies = async (req, res) => {
    const userId = req.user.id;

    try {
        const userComments = await Comment.findAll({
            where: { userId },
            attributes: ['id'],
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
                    as: 'user',
                    attributes: SAFE_USER_ATTRIBUTES,
                },
            ],
        });

        const sanitizedReplies = replies.map(reply => {
            const replyObj = reply.toJSON();
            if (replyObj.user) {
                replyObj.user = sanitizeUserData(replyObj.user, false);
            }
            return replyObj;
        });

        res.status(200).json({ replies: sanitizedReplies });
    } catch (err) {
        logger.error('Ошибка получения ответов:', err);
        res.status(500).json({
            error: `Ошибка получения ответов: ${err.message}`,
        });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            logger.warn(`Неверный текущий пароль при смене пароля для пользователя ${userId}`, {
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            return res.status(400).json({ error: 'Неверный текущий пароль' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        logger.info(`Пароль успешно изменён для пользователя ${userId}`, {
            timestamp: new Date().toISOString()
        });

        res.status(200).json({ message: 'Пароль успешно изменён' });
    } catch (err) {
        logger.error('Ошибка смены пароля:', err);
        res.status(500).json({
            error: `Ошибка смены пароля: ${err.message}`,
        });
    }
};

exports.logOutUser = (req, res) => {
    if (req.user) {
        logger.info(`Пользователь ${req.user.id} вышел из системы`, {
            timestamp: new Date().toISOString()
        });
    }

    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.status(200).json({ message: 'Вы вышли из системы' });
};