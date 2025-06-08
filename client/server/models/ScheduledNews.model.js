const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScheduledNews = sequelize.define('ScheduledNews', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Заголовок новости для удобства'
        },
        scheduledDate: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Дата и время планируемой публикации'
        },
        newsData: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'JSON с данными новости'
        },
        authorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('scheduled', 'published', 'error', 'cancelled'),
            defaultValue: 'scheduled',
            comment: 'Статус отложенной новости'
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Сообщение об ошибке при публикации'
        },
        lastAttempt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Время последней попытки публикации'
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'ScheduledNews',
        timestamps: true,
        indexes: [
            {
                fields: ['scheduledDate', 'status']
            },
            {
                fields: ['authorId']
            }
        ]
    });

    ScheduledNews.associate = (models) => {
        ScheduledNews.belongsTo(models.User, {
            foreignKey: 'authorId',
            as: 'author'
        });
    };

    return ScheduledNews;
};