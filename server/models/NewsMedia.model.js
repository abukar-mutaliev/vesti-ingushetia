module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');

    const NewsMedia = sequelize.define(
        'NewsMedia',
        {
            newsId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'news',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            mediaId: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'media',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        },
        {
            tableName: 'news_media',
            timestamps: false,
        },
    );

    return NewsMedia;
};