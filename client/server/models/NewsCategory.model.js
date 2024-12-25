const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const NewsCategory = sequelize.define(
        'NewsCategory',
        {
            newsId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'news',
                    key: 'id',
                },
                primaryKey: true,
            },
            categoryId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'categories',
                    key: 'id',
                },
                primaryKey: true,
            }
        },
        {
            tableName: 'NewsCategory',
            timestamps: false ,
            createdAt: false,
            updatedAt: false,
        }
    );

    return NewsCategory;
};