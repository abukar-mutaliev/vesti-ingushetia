'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const newsTable = await queryInterface.describeTable('news');

        if (!newsTable.isElections) {
            await queryInterface.addColumn('news', 'isElections', {
                type: Sequelize.BOOLEAN,
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
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                url: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                originalFilename: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            });
        }

        if (!normalizedTables.includes('election_banners')) {
            await queryInterface.createTable('election_banners', {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                url: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                originalFilename: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                title: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    defaultValue: 'Выборы 2026',
                },
                isVisible: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            });
        }
    },

    down: async (queryInterface) => {
        const newsTable = await queryInterface.describeTable('news');

        if (newsTable.isElections) {
            await queryInterface.removeColumn('news', 'isElections');
        }

        await queryInterface.dropTable('election_banners');
        await queryInterface.dropTable('election_pdfs');
    },
};
