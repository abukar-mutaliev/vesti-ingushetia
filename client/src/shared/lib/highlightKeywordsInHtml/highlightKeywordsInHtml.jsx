export const highlightKeywordsInHtml = (htmlContent, keywords) => {
    if (typeof htmlContent !== 'string' || !keywords) {
        return htmlContent;
    }

    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const regex = new RegExp(`(${escapeRegExp(keywords)})`, 'gi');

    const highlightedContent = htmlContent.replace(
        regex,
        '<span style="color: #FF6347; font-weight: bold;">$1</span>',
    );

    return highlightedContent;
};
