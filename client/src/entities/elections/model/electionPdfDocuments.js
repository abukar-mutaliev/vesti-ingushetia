export const ELECTION_PDF_DOCUMENTS = [
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

export const getElectionPdfByKey = (pdfs, documentKey) =>
    pdfs.find((pdf) => pdf.documentKey === documentKey) ?? null;
