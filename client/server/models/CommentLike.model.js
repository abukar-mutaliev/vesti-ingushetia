const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CommentLike = sequelize.define(
        'CommentLike',
        {
            userId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            commentId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                references: {
                    model: 'comments',
                    key: 'id',
                },
            },
        },
        {
            tableName: 'comment_likes',
            timestamps: true,
        },
    );

    CommentLike.associate = (models) => {
        CommentLike.belongsTo(models.User, {
            foreignKey: 'userId',
        });
        CommentLike.belongsTo(models.Comment, {
            foreignKey: 'commentId',
        });
    };

    return CommentLike;
};
