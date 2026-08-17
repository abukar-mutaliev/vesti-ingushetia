const { DataTypes } = require('sequelize');
const {
    LEGACY_PDF_TITLES,
    LEGACY_PDF_SORT_ORDER,
} = require('../constants/electionPdfDocuments');

async function ensureElectionPdfColumns(queryInterface) {
    const pdfTable = await queryInterface.describeTable('election_pdfs');

    if (!pdfTable.title) {
        await queryInterface.addColumn('election_pdfs', 'title', {
            type: DataTypes.STRING,
            allowNull: true,
        });
    }

    if (!pdfTable.sortOrder) {
        await queryInterface.addColumn('election_pdfs', 'sortOrder', {
            type: DataTypes.INTEGER,
            allowNull: true,
        });
    }

    for (const [documentKey, title] of Object.entries(LEGACY_PDF_TITLES)) {
        await queryInterface.sequelize.query(
            `
            UPDATE election_pdfs
            SET title = :title,
                "sortOrder" = :sortOrder
            WHERE "documentKey" = :documentKey
              AND (title IS NULL OR title = '')
            `,
            {
                replacements: {
                    title,
                    sortOrder: LEGACY_PDF_SORT_ORDER[documentKey],
                    documentKey,
                },
            },
        );
    }

    await queryInterface.sequelize.query(`
        UPDATE election_pdfs
        SET title = "originalFilename"
        WHERE title IS NULL OR title = ''
    `);

    await queryInterface.sequelize.query(`
        UPDATE election_pdfs
        SET "sortOrder" = id
        WHERE "sortOrder" IS NULL
    `);

    const updatedPdfTable = await queryInterface.describeTable('election_pdfs');

    if (updatedPdfTable.title) {
        await queryInterface.changeColumn('election_pdfs', 'title', {
            type: DataTypes.STRING,
            allowNull: false,
        });
    }

    if (updatedPdfTable.sortOrder) {
        await queryInterface.changeColumn('election_pdfs', 'sortOrder', {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });
    }

    if (updatedPdfTable.documentKey) {
        await queryInterface.changeColumn('election_pdfs', 'documentKey', {
            type: DataTypes.STRING,
            allowNull: true,
        });
    }
}

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
    } else {
        await ensureElectionPdfColumns(queryInterface);
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
