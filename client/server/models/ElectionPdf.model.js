const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ElectionPdf = sequelize.define(
        'ElectionPdf',
        {
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
