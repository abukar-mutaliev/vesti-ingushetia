'use strict';

const {
    LEGACY_PDF_TITLES,
    LEGACY_PDF_SORT_ORDER,
} = require('../constants/electionPdfDocuments');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const pdfTable = await queryInterface.describeTable('election_pdfs');

        if (!pdfTable.title) {
            await queryInterface.addColumn('election_pdfs', 'title', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }

        if (!pdfTable.sortOrder) {
            await queryInterface.addColumn('election_pdfs', 'sortOrder', {
                type: Sequelize.INTEGER,
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

        await queryInterface.changeColumn('election_pdfs', 'title', {
            type: Sequelize.STRING,
            allowNull: false,
        });

        await queryInterface.changeColumn('election_pdfs', 'sortOrder', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });

        if (pdfTable.documentKey) {
            await queryInterface.changeColumn('election_pdfs', 'documentKey', {
                type: Sequelize.STRING,
                allowNull: true,
            });

            try {
                await queryInterface.removeIndex(
                    'election_pdfs',
                    'election_pdfs_document_key_unique',
                );
            } catch {
                // index may not exist
            }
        }
    },

    down: async (queryInterface, Sequelize) => {
        const pdfTable = await queryInterface.describeTable('election_pdfs');

        if (pdfTable.sortOrder) {
            await queryInterface.removeColumn('election_pdfs', 'sortOrder');
        }

        if (pdfTable.title) {
            await queryInterface.removeColumn('election_pdfs', 'title');
        }

        if (pdfTable.documentKey) {
            await queryInterface.changeColumn('election_pdfs', 'documentKey', {
                type: Sequelize.STRING,
                allowNull: false,
            });
        }
    },
};
