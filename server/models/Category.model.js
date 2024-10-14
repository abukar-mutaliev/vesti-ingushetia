const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'categories',
        timestamps: true,
    });

    Category.associate = (models) => {
        Category.hasMany(models.News, {
            foreignKey: 'categoryId',
            as: 'news',
        });
    };

    return Category;
};
