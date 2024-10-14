const { Rating } = require('../models/index');

exports.getNewsRatings = async (req, res) => {
    const { newsId } = req.params;
    try {
        const ratings = await Rating.findAll({ where: { newsId } });
        res.json(ratings);
    } catch (err) {
        console.error('Error fetching ratings:', err);
        res.status(500).json({ error: `Ошибка получения рейтингов: ${err}` });
    }
};

exports.createRating = async (req, res) => {
    const { userId, newsId, rating } = req.body;
    try {
        const newRating = await Rating.create({
            userId,
            newsId,
            rating
        });
        res.status(201).json(newRating);
    } catch (err) {
        console.error('Error creating rating:', err);
        res.status(500).json({ error: `Ошибка создания рейтинга: ${err}` });
    }
};

exports.deleteRating = async (req, res) => {
    const { ratingId } = req.params;
    try {
        const rating = await Rating.findByPk(ratingId);
        if (!rating) {
            return res.status(404).json({ error: 'Рейтинг не найден' });
        }
        await rating.destroy();
        res.json({ message: 'Рейтинг успешно удален' });
    } catch (err) {
        console.error('Error deleting rating:', err);
        res.status(500).json({ error: `Ошибка удаления рейтинга: ${err}` });
    }
};
