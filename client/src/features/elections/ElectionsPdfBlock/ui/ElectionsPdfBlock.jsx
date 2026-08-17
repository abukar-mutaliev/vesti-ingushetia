import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchElectionPdfs } from '@entities/elections/model/electionsSlice';
import {
    selectElectionPdfs,
    selectPdfStatus,
} from '@entities/elections/model/electionsSelectors';
import { Loader } from '@shared/ui/Loader/index.js';
import { PdfPreviewPanel } from './PdfPreviewPanel';
import styles from './ElectionsPdfBlock.module.scss';

const PREVIEW_ANIMATION_MS = 420;

export const ElectionsPdfBlock = () => {
    const dispatch = useDispatch();
    const electionPdfs = useSelector(selectElectionPdfs);
    const pdfStatus = useSelector(selectPdfStatus);
    const [activePdfId, setActivePdfId] = useState(null);
    const [mountedPdfId, setMountedPdfId] = useState(null);
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
            setMountedPdfId(null);
            closeTimerRef.current = null;
        }, PREVIEW_ANIMATION_MS);
    };

    const handleDocumentClick = (pdfId) => {
        clearCloseTimer();

        if (activePdfId === pdfId) {
            setActivePdfId(null);
            scheduleUnmount();
            return;
        }

        if (activePdfId) {
            setActivePdfId(null);
            closeTimerRef.current = window.setTimeout(() => {
                setMountedPdfId(pdfId);
                requestAnimationFrame(() => {
                    setActivePdfId(pdfId);
                });
                closeTimerRef.current = null;
            }, PREVIEW_ANIMATION_MS);
            return;
        }

        setMountedPdfId(pdfId);
        requestAnimationFrame(() => {
            setActivePdfId(pdfId);
        });
    };

    const isLoading = pdfStatus === 'loading' && electionPdfs.length === 0;

    return (
        <section className={styles.block} aria-labelledby="elections-pdf-title">
            <h2 id="elections-pdf-title" className={styles.title}>
                Документы
            </h2>

            {isLoading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : electionPdfs.length > 0 ? (
                <div className={styles.content}>
                    <div className={styles.documentList}>
                        {electionPdfs.map((pdf) => {
                            const isOpen = activePdfId === pdf.id;
                            const isMounted = mountedPdfId === pdf.id;
                            const isClosing = isMounted && !isOpen;

                            return (
                                <div key={pdf.id} className={styles.documentItem}>
                                    <button
                                        type="button"
                                        className={`${styles.documentButton} ${isOpen ? styles.documentButtonActive : ''}`}
                                        onClick={() => handleDocumentClick(pdf.id)}
                                        aria-expanded={isOpen}
                                        aria-controls={`pdf-preview-${pdf.id}`}
                                    >
                                        <span className={styles.documentButtonTitle}>
                                            {pdf.title}
                                        </span>
                                    </button>

                                    {isMounted && (
                                        <div
                                            id={`pdf-preview-${pdf.id}`}
                                            className={`${styles.previewWrapper} ${isOpen ? styles.previewWrapperOpen : ''} ${isClosing ? styles.previewWrapperClosing : ''}`}
                                            aria-hidden={!isOpen}
                                        >
                                            <div className={styles.previewInner}>
                                                <div
                                                    className={`${styles.previewContainer} ${isClosing ? styles.previewContainerClosing : ''}`}
                                                >
                                                    <PdfPreviewPanel pdf={pdf} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <p className={styles.emptyState}>
                    PDF-документы пока не загружены
                </p>
            )}
        </section>
    );
};
