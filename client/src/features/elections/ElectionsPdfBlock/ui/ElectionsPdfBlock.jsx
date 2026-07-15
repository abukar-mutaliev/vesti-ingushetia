import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchElectionPdfs } from '@entities/elections/model/electionsSlice';
import {
    selectElectionPdfs,
    selectPdfStatus,
} from '@entities/elections/model/electionsSelectors';
import { ELECTION_PDF_DOCUMENTS } from '@entities/elections/model/electionPdfDocuments';
import { Loader } from '@shared/ui/Loader/index.js';
import { PdfPreviewPanel } from './PdfPreviewPanel';
import styles from './ElectionsPdfBlock.module.scss';

const PREVIEW_ANIMATION_MS = 420;

export const ElectionsPdfBlock = () => {
    const dispatch = useDispatch();
    const electionPdfs = useSelector(selectElectionPdfs);
    const pdfStatus = useSelector(selectPdfStatus);
    const [activeDocumentKey, setActiveDocumentKey] = useState(null);
    const [mountedDocumentKey, setMountedDocumentKey] = useState(null);
    const closeTimerRef = useRef(null);

    useEffect(() => {
        dispatch(fetchElectionPdfs());
    }, [dispatch]);

    useEffect(
        () => () => {
            if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current);
            }
        },
        [],
    );

    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const scheduleUnmount = () => {
        clearCloseTimer();
        closeTimerRef.current = window.setTimeout(() => {
            setMountedDocumentKey(null);
            closeTimerRef.current = null;
        }, PREVIEW_ANIMATION_MS);
    };

    const handleDocumentClick = (documentKey) => {
        clearCloseTimer();

        if (activeDocumentKey === documentKey) {
            setActiveDocumentKey(null);
            scheduleUnmount();
            return;
        }

        if (activeDocumentKey) {
            setActiveDocumentKey(null);
            closeTimerRef.current = window.setTimeout(() => {
                setMountedDocumentKey(documentKey);
                requestAnimationFrame(() => {
                    setActiveDocumentKey(documentKey);
                });
                closeTimerRef.current = null;
            }, PREVIEW_ANIMATION_MS);
            return;
        }

        setMountedDocumentKey(documentKey);
        requestAnimationFrame(() => {
            setActiveDocumentKey(documentKey);
        });
    };

    const isLoading =
        pdfStatus === 'loading' &&
        electionPdfs.every((pdf) => !pdf.url);

    return (
        <section className={styles.block} aria-labelledby="elections-pdf-title">
            <h2 id="elections-pdf-title" className={styles.title}>
                Документы
            </h2>

            {isLoading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.content}>
                    <div className={styles.documentList}>
                        {ELECTION_PDF_DOCUMENTS.map((document) => {
                            const isOpen =
                                activeDocumentKey === document.documentKey;
                            const isMounted =
                                mountedDocumentKey === document.documentKey;
                            const isClosing = isMounted && !isOpen;
                            const currentPdf = electionPdfs.find(
                                (pdf) =>
                                    pdf.documentKey === document.documentKey,
                            );
                            const hasFile = Boolean(currentPdf?.url);

                            return (
                                <div
                                    key={document.documentKey}
                                    className={styles.documentItem}
                                >
                                    <button
                                        type="button"
                                        className={`${styles.documentButton} ${isOpen ? styles.documentButtonActive : ''}`}
                                        onClick={() =>
                                            handleDocumentClick(
                                                document.documentKey,
                                            )
                                        }
                                        aria-expanded={isOpen}
                                        aria-controls={`pdf-preview-${document.documentKey}`}
                                    >
                                        <span className={styles.documentButtonTitle}>
                                            {document.title}
                                        </span>
                                        {!hasFile && (
                                            <span className={styles.documentBadge}>
                                                Не загружен
                                            </span>
                                        )}
                                    </button>

                                    {isMounted && (
                                        <div
                                            id={`pdf-preview-${document.documentKey}`}
                                            className={`${styles.previewWrapper} ${isOpen ? styles.previewWrapperOpen : ''} ${isClosing ? styles.previewWrapperClosing : ''}`}
                                            aria-hidden={!isOpen}
                                        >
                                            <div className={styles.previewInner}>
                                                <div
                                                    className={`${styles.previewContainer} ${isClosing ? styles.previewContainerClosing : ''}`}
                                                >
                                                    <PdfPreviewPanel
                                                        pdf={
                                                            currentPdf ?? {
                                                                ...document,
                                                                url: null,
                                                                originalFilename: null,
                                                            }
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
};
