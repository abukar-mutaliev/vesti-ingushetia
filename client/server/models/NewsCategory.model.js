const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const NewsCategory = sequelize.define('NewsCategory', {
        newsId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'News',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Category',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
    }, {
        tableName: 'NewsCategory',
        timestamps: false,
    });

    return NewsCategory;
};
