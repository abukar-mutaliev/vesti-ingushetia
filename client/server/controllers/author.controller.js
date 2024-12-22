const { News, User, Category, Comment, Author, Media } = require('../models');
const { body, param, validationResult } = require('express-validator');

exports.getAllAuthors = async (req, res) => {
    try {
        const authors = await Author.findAll();
        res.json(authors);
    } catch (err) {
        res.status(500).json({
            error: `Ошибка получения авторов: ${err.message}`,
        });
    }
};

exports.getNewsByAuthor = [
    param('authorId')
        .isInt({ gt: 0 })
        .withMessage('authorId должен быть положительным целым числом'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { authorId } = req.params;

            const newsList = await News.findAll({
                where: { authorId },
                include: [
                    {
                        model: User,
                        as: 'authorDetails',
                        attributes: ['id', 'username', 'email'],
                    },
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Comment,
                        as: 'comments',
                        attributes: ['id', 'content', 'createdAt'],
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['id', 'username'],
                            },
                        ],
                    },
                    {
                        model: Media,
                        as: 'mediaFiles',
                        attributes: ['id', 'type', 'url'],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            if (!newsList || newsList.length === 0) {
                return res
                    .status(404)
                    .json({ message: 'Новости этого автора не найдены' });
            }

            res.status(200).json(newsList);
        } catch (err) {
            console.error('Ошибка получения новостей автора:', err);
            res.status(500).json({
                error: `Ошибка получения новостей автора: ${err.message}`,
            });
        }
    },
];

exports.getAuthorById = [
    param('id')
        .isInt({ gt: 0 })
        .withMessage('ID автора должен быть положительным целым числом'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        try {
            const author = await Author.findByPk(id);
            if (!author) {
                return res.status(404).json({ error: 'Автор не найден' });
            }
            res.json(author);
        } catch (err) {
            res.status(500).json({
                error: `Ошибка получения автора: ${err.message}`,
            });
        }
    },
];

exports.createAuthor = [
    body('name')
        .notEmpty()
        .withMessage('Имя автора обязательно')
        .isLength({ max: 100 })
        .withMessage('Имя автора не должно превышать 100 символов'),
    body('email')
        .notEmpty()
        .withMessage('Email обязателен')
        .isEmail()
        .withMessage('Некорректный формат email')
        .normalizeEmail(),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Биография не должна превышать 500 символов'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, bio } = req.body;
        try {
            const newAuthor = await Author.create({ name, email, bio });
            res.status(201).json(newAuthor);
        } catch (err) {
            res.status(500).json({
                error: `Ошибка создания автора: ${err.message}`,
            });
        }
    },
];

exports.updateAuthor = [
    param('id')
        .isInt({ gt: 0 })
        .withMessage('ID автора должен быть положительным целым числом'),

    body('name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Имя автора не должно превышать 100 символов'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Некорректный формат email')
        .normalizeEmail(),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Биография не должна превышать 500 символов'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, email, bio } = req.body;
        try {
            const author = await Author.findByPk(id);
            if (!author) {
                return res.status(404).json({ error: 'Автор не найден' });
            }

            author.name = name || author.name;
            author.email = email || author.email;
            author.bio = bio || author.bio;

            await author.save();
            res.json(author);
        } catch (err) {
            res.status(500).json({
                error: `Ошибка обновления автора: ${err.message}`,
            });
        }
    },
];

exports.deleteAuthor = [
    param('id')
        .isInt({ gt: 0 })
        .withMessage('ID автора должен быть положительным целым числом'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        try {
            const author = await Author.findByPk(id);
            if (!author) {
                return res.status(404).json({ error: 'Автор не найден' });
            }

            await author.destroy();
            res.json({ message: 'Автор успешно удален' });
        } catch (err) {
            res.status(500).json({
                error: `Ошибка удаления автора: ${err.message}`,
            });
        }
    },
];
