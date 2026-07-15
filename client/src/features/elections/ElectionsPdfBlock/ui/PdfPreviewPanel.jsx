import { useEffect, useState } from 'react';
import { Loader } from '@shared/ui/Loader/index.js';
import styles from './ElectionsPdfBlock.module.scss';

const usePdfPreview = (pdfUrl) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewError, setPreviewError] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    useEffect(() => {
        if (!pdfUrl) {
            setPreviewUrl(null);
            setPreviewError(false);
            setIsPreviewLoading(false);
            return undefined;
        }

        let objectUrl;
        let cancelled = false;

        setIsPreviewLoading(true);
        setPreviewError(false);

        fetch(pdfUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Не удалось загрузить PDF');
                }
                return response.blob();
            })
            .then((blob) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setPreviewUrl(objectUrl);
            })
            .catch(() => {
                if (!cancelled) {
                    setPreviewError(true);
                    setPreviewUrl(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsPreviewLoading(false);
                }
            });

        return () => {
            cancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
            setPreviewUrl((prev) => {
                if (prev?.startsWith('blob:')) {
                    URL.revokeObjectURL(prev);
                }
                return null;
            });
        };
    }, [pdfUrl]);

    return { previewUrl, previewError, isPreviewLoading };
};

const PdfPreviewPanel = ({ pdf }) => {
    const { previewUrl, previewError, isPreviewLoading } = usePdfPreview(pdf?.url);

    const handleDownloadPdf = async () => {
        const filename = pdf?.originalFilename || 'document.pdf';

        if (previewUrl) {
            const link = document.createElement('a');
            link.href = previewUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            return;
        }

        if (!pdf?.url) {
            return;
        }

        try {
            const response = await fetch(pdf.url);
            if (!response.ok) {
                throw new Error('Не удалось скачать PDF');
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);
        } catch {
            window.open(pdf.url, '_blank', 'noopener,noreferrer');
        }
    };

    if (!pdf?.url) {
        return (
            <p className={styles.emptyPreview}>
                Документ пока не загружен
            </p>
        );
    }

    return (
        <div className={styles.previewPanel}>
            <div className={styles.viewerWrapper}>
                {isPreviewLoading ? (
                    <div className={styles.viewerLoader}>
                        <Loader />
                    </div>
                ) : previewUrl ? (
                    <iframe
                        src={previewUrl}
                        title={pdf.title}
                        className={styles.viewer}
                    />
                ) : (
                    <div className={styles.viewerFallback}>
                        {previewError
                            ? 'Не удалось загрузить предпросмотр'
                            : 'Предпросмотр недоступен'}
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.openLink}
                >
                    Открыть PDF
                </a>
                <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isPreviewLoading}
                    className={styles.downloadLink}
                >
                    Скачать PDF
                </button>
            </div>
        </div>
    );
};

export { PdfPreviewPanel, usePdfPreview };
