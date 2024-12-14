const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Rating = sequelize.define(
        'Rating',
        {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            newsId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'news',
                    key: 'id',
                },
            },
            rating: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: 'ratings',
            timestamps: true,
        },
    );

    Rating.associate = (models) => {
        Rating.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Rating.belongsTo(models.News, { foreignKey: 'newsId', as: 'news' });
    };

    return Rating;
};
