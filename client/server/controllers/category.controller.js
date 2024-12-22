const { Category, Author, News, User, Comment, Media } = require('../models');

exports.addCategory = async (req, res) => {
    const { name } = req.body;

    try {
        const newCategory = await Category.create({ name });
        return res.status(201).json(newCategory);
    } catch (error) {
        console.error('Ошибка добавления категории:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        return res.status(200).json(categories);
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.getNewsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.findByPk(categoryId, {
            include: {
                model: News,
                as: 'news',
                include: [
                    { model: User, as: 'authorDetails' },
                    { model: Category, as: 'category' },
                    { model: Comment, as: 'comments' },
                    { model: Media, as: 'mediaFiles' },
                    { model: Author, as: 'author' },
                ],
            },
        });

        if (!category) {
            return res.status(404).json({ message: 'Категория не найдена' });
        }

        return res.status(200).json(category.news);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
};

exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }

        category.name = name || category.name;

        await category.save();
        res.json(category);
    } catch (err) {
        res.status(500).json({
            error: `Ошибка обновления категории: ${err.message}`,
        });
    }
};

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({ message: 'Категория не найдена' });
        }

        await category.destroy();
        return res.status(200).json({ message: 'Категория удалена' });
    } catch (error) {
        console.error('Ошибка удаления категории:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
};
