import parse from 'html-react-parser';

export const highlightKeywordsInHtml = (htmlContent, keywords) => {
    if (typeof htmlContent !== 'string') {
        return htmlContent;
    }

    const regex = new RegExp(`(${keywords})`, 'gi');

    const options = {
        replace: (node) => {
            if (node.type === 'text') {
                const parts = node.data.split(regex);
                return parts.map((part, index) => {
                    if (part.toLowerCase() === keywords.toLowerCase()) {
                        return (
                            <span
                                key={index}
                                style={{ color: '#FF6347', fontWeight: 'bold' }}
                            >
                                {part}
                            </span>
                        );
                    }
                    return part;
                });
            }
        },
    };

    return parse(htmlContent, options);
};
