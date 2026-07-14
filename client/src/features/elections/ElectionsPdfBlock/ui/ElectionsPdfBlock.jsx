import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentElectionPdf } from '@entities/elections/model/electionsSlice';
import {
    selectCurrentElectionPdf,
    selectPdfStatus,
} from '@entities/elections/model/electionsSelectors';
import { Loader } from '@shared/ui/Loader/index.js';
import styles from './ElectionsPdfBlock.module.scss';

const PDF_DISPLAY_TITLE =
    'Сведения о размере и условиях оплаты, а также иных условиях размещения предвыборной агитации';

export const ElectionsPdfBlock = () => {
    const dispatch = useDispatch();
    const pdf = useSelector(selectCurrentElectionPdf);
    const pdfStatus = useSelector(selectPdfStatus);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewError, setPreviewError] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchCurrentElectionPdf());
    }, [dispatch]);

    useEffect(() => {
        if (!pdf?.url) {
            setPreviewUrl(null);
            setPreviewError(false);
            setIsPreviewLoading(false);
            return;
        }

        let objectUrl;
        let cancelled = false;

        setIsPreviewLoading(true);
        setPreviewError(false);

        fetch(pdf.url)
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
    }, [pdf?.url]);

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

    const isLoading = pdfStatus === 'loading' && !pdf;

    return (
        <section className={styles.block} aria-labelledby="elections-pdf-title">
            <h2 id="elections-pdf-title" className={styles.title}>
                Документы
            </h2>

            {isLoading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : pdf?.url ? (
                <div className={styles.content}>
                    <p className={styles.fileName}>{PDF_DISPLAY_TITLE}</p>

                    <div className={styles.viewerWrapper}>
                        {isPreviewLoading ? (
                            <div className={styles.viewerLoader}>
                                <Loader />
                            </div>
                        ) : previewUrl ? (
                            <iframe
                                src={previewUrl}
                                title={PDF_DISPLAY_TITLE}
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
            ) : (
                <p className={styles.emptyState}>
                    PDF-документ пока не загружен
                </p>
            )}
        </section>
    );
};
