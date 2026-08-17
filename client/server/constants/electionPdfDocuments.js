const MAX_ELECTION_PDFS = 15;

const LEGACY_PDF_TITLES = {
    state_duma:
        'ОБЩИЕ УСЛОВИЯ ДЛЯ ПУБЛИКАЦИИ – ВЫБОРЫ ДЕПУТАТОВ ГОСУДАРСТВЕННОЙ ДУМЫ РФ',
    parliament_ri:
        'ОБЩИЕ УСЛОВИЯ ДЛЯ ПУБЛИКАЦИИ – ВЫБОРЫ ДЕПУТАТОВ НАРОДНОГО СОБРАНИЯ РИ',
};

const LEGACY_PDF_SORT_ORDER = {
    state_duma: 1,
    parliament_ri: 2,
};

module.exports = {
    MAX_ELECTION_PDFS,
    LEGACY_PDF_TITLES,
    LEGACY_PDF_SORT_ORDER,
};
