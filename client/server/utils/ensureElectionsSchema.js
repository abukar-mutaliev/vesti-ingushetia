const { DataTypes } = require('sequelize');

async function ensureElectionsSchema(sequelize) {
    const queryInterface = sequelize.getQueryInterface();

    const newsTable = await queryInterface.describeTable('news');

    if (!newsTable.isElections) {
        await queryInterface.addColumn('news', 'isElections', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    }

    const tables = await queryInterface.showAllTables();
    const normalizedTables = tables.map((table) =>
        typeof table === 'string' ? table.toLowerCase() : table,
    );

    if (!normalizedTables.includes('election_pdfs')) {
        await queryInterface.createTable('election_pdfs', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            url: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            originalFilename: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        });
    }

    if (!normalizedTables.includes('election_banners')) {
        await queryInterface.createTable('election_banners', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            url: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            originalFilename: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Выборы 2026',
            },
            isVisible: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        });
    }
}

module.exports = { ensureElectionsSchema };
