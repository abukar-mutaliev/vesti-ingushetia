const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Category = sequelize.define(
        'Category',
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: 'categories',
            timestamps: false,
        },
    );

    Category.associate = (models) => {
        Category.belongsToMany(models.News, {
            through: {
                model: 'NewsCategory',
                timestamps: false
            },
            foreignKey: 'categoryId',
            otherKey: 'newsId',
            as: 'news',
        });
    };

    return Category;
};