const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Media = sequelize.define(
        'Media',
        {
            url: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [['image', 'video', 'audio']],
                },
            },
        },
        {
            tableName: 'media',
            timestamps: true,
        },
    );

    Media.associate = (models) => {
        Media.belongsToMany(models.News, {
            through: 'NewsMedia',
            foreignKey: 'mediaId',
            otherKey: 'newsId',
            as: 'news',
        });
    };

    return Media;
};
