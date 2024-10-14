const { Tag } = require('../models/index');

exports.getAllTags = async (req, res) => {
    try {
        const tags = await Tag.findAll();
        res.json(tags);
    } catch (err) {
        console.error('Error fetching tags:', err);
        res.status(500).json({ error: 'Ошибка получения тегов' });
    }
};

exports.createTag = async (req, res) => {
    const { name } = req.body;
    try {
        const tag = await Tag.create({
            name
        });
        res.status(201).json(tag);
    } catch (err) {
        console.error('Error creating tag:', err);
        res.status(500).json({ error: `Ошибка создания тега: ${err}` });
    }
};

exports.deleteTag = async (req, res) => {
    const { tagId } = req.params;
    try {
        const tag = await Tag.findByPk(tagId);
        if (!tag) {
            return res.status(404).json({ error: 'Тег не найден' });
        }
        await tag.destroy();
        res.json({ message: 'Тег успешно удален' });
    } catch (err) {
        console.error('Error deleting tag:', err);
        res.status(500).json({ error: 'Ошибка удаления тега' });
    }
};
