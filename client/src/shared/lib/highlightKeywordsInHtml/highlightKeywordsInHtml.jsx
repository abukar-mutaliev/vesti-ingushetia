import DOMPurify from 'dompurify';


export const highlightKeywordsInHtml = (htmlContent, keywords) => {
    if (typeof htmlContent !== 'string' || !keywords) {
        return DOMPurify.sanitize(htmlContent);
    }

    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const keywordsArray = keywords.split(/\s+/).filter(Boolean);
    if (keywordsArray.length === 0) {
        return DOMPurify.sanitize(htmlContent);
    }

    const regex = new RegExp(`(${keywordsArray.map(escapeRegExp).join('|')})`, 'gi');

    const highlightedContent = htmlContent.replace(
        regex,
        '<span style="color: #FF6347; font-weight: bold;">$1</span>',
    );

    const sanitizedContent = DOMPurify.sanitize(highlightedContent);

    return sanitizedContent;
};
