const ELECTION_PDF_DOCUMENTS = [
    {
        documentKey: 'state_duma',
        title:
            'ОБЩИЕ УСЛОВИЯ ДЛЯ ПУБЛИКАЦИИ – ВЫБОРЫ ДЕПУТАТОВ ГОСУДАРСТВЕННОЙ ДУМЫ РФ',
    },
    {
        documentKey: 'parliament_ri',
        title:
            'ОБЩИЕ УСЛОВИЯ ДЛЯ ПУБЛИКАЦИИ – ВЫБОРЫ ДЕПУТАТОВ НАРОДНОГО СОБРАНИЯ РИ',
    },
];

const ELECTION_PDF_DOCUMENT_KEYS = ELECTION_PDF_DOCUMENTS.map(
    (doc) => doc.documentKey,
);

const getElectionPdfDocumentTitle = (documentKey) =>
    ELECTION_PDF_DOCUMENTS.find((doc) => doc.documentKey === documentKey)
        ?.title ?? null;

module.exports = {
    ELECTION_PDF_DOCUMENTS,
    ELECTION_PDF_DOCUMENT_KEYS,
    getElectionPdfDocumentTitle,
};
