const { Subscription } = require('../models/index');

exports.getUserSubscriptions = async (req, res) => {
    const { userId } = req.params;
    try {
        const subscriptions = await Subscription.findAll({ where: { userId } });
        res.json(subscriptions);
    } catch (err) {
        console.error('Error fetching subscriptions:', err);
        res.status(500).json({ error: 'Ошибка получения подписок' });
    }
};

exports.createSubscription = async (req, res) => {
    const { userId, categoryId, authorId } = req.body;
    try {
        const subscription = await Subscription.create({ userId, categoryId, authorId });
        res.status(201).json(subscription);
    } catch (err) {
        console.error('Error creating subscription:', err);
        res.status(500).json({ error: `Ошибка создания подписки: ${err}` });
    }
};

exports.deleteSubscription = async (req, res) => {
    const { subscriptionId } = req.params;
    try {
        const subscription = await Subscription.findByPk(subscriptionId);
        if (!subscription) {
            return res.status(404).json({ error: 'Подписка не найдена' });
        }
        await subscription.destroy();
        res.json({ message: 'Подписка успешно удалена' });
    } catch (err) {
        console.error('Error deleting subscription:', err);
        res.status(500).json({ error: 'Ошибка удаления подписки' });
    }
};
