const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Subscription = sequelize.define('Subscription', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'categories',
                key: 'id'
            }
        },
        authorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'authors',
                key: 'id'
            }
        }
    }, {
        tableName: 'subscriptions',
        timestamps: true,
    });

    Subscription.associate = (models) => {
        Subscription.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Subscription.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
        Subscription.belongsTo(models.Author, { foreignKey: 'authorId', as: 'author' });
    };

    return Subscription;
};
