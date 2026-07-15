'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const pdfTable = await queryInterface.describeTable('election_pdfs');

        if (!pdfTable.documentKey) {
            await queryInterface.addColumn('election_pdfs', 'documentKey', {
                type: Sequelize.STRING,
                allowNull: true,
            });

            await queryInterface.sequelize.query(`
                UPDATE election_pdfs
                SET "documentKey" = 'state_duma'
                WHERE "documentKey" IS NULL
            `);

            await queryInterface.changeColumn('election_pdfs', 'documentKey', {
                type: Sequelize.STRING,
                allowNull: false,
            });

            await queryInterface.addIndex('election_pdfs', ['documentKey'], {
                unique: true,
                name: 'election_pdfs_document_key_unique',
            });
        }
    },

    down: async (queryInterface) => {
        const pdfTable = await queryInterface.describeTable('election_pdfs');

        if (pdfTable.documentKey) {
            await queryInterface.removeIndex(
                'election_pdfs',
                'election_pdfs_document_key_unique',
            );
            await queryInterface.removeColumn('election_pdfs', 'documentKey');
        }
    },
};
