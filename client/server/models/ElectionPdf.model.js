const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ElectionPdf = sequelize.define(
        'ElectionPdf',
        {
            documentKey: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            sortOrder: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            url: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            originalFilename: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: 'election_pdfs',
            timestamps: true,
        },
    );

    return ElectionPdf;
};
