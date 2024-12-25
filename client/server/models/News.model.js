const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const News = sequelize.define(
        'News',
        {
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            authorId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            views: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            publishDate: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'news',
            timestamps: true,
        },
    );

    News.associate = (models) => {
        News.belongsTo(models.User, {
            foreignKey: 'authorId',
            as: 'authorDetails',
        });
        News.hasMany(models.Comment, {
            foreignKey: 'newsId',
            as: 'comments'
        });
        News.belongsToMany(models.Media, {
            through: {
                model: 'NewsMedia',
                timestamps: false
            },
            foreignKey: 'newsId',
            otherKey: 'mediaId',
            as: 'mediaFiles',
        });
        News.belongsToMany(models.Category, {
            through: {
                model: 'NewsCategory',
                timestamps: false
            },
            foreignKey: 'newsId',
            otherKey: 'categoryId',
            as: 'categories',
        });
    };

    return News;
};