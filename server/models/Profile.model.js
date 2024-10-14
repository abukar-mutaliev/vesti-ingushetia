const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Profile = sequelize.define('Profile', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        avatarUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'profiles',
        timestamps: true,
    });

    Profile.associate = (models) => {
        Profile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    };

    return Profile;
};
