import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchElectionPdfs,
    uploadElectionPdf,
    deleteElectionPdf,
    clearElectionsPdfError,
    fetchCurrentElectionBanner,
    updateElectionBannerSettings,
    uploadElectionBanner,
    deleteElectionBannerImage,
    clearElectionsBannerError,
    DEFAULT_BANNER_TITLE,
} from '@entities/elections/model/electionsSlice';
import {
    selectElectionPdfs,
    selectPdfStatus,
    selectPdfError,
    selectCurrentElectionBanner,
    selectBannerStatus,
    selectBannerError,
} from '@entities/elections/model/electionsSelectors';
import { ELECTION_PDF_DOCUMENTS } from '@entities/elections/model/electionPdfDocuments';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';
import { UploadStatusIndicator } from './UploadStatusIndicator';
import { ElectionPdfUploadCard } from './ElectionPdfUploadCard';
import styles from './ElectionsSection.module.scss';

const SUCCESS_INDICATOR_DURATION_MS = 4500;

export const ElectionsSection = () => {
    const dispatch = useDispatch();
    const electionPdfs = useSelector(selectElectionPdfs);
    const pdfStatus = useSelector(selectPdfStatus);
    const pdfError = useSelector(selectPdfError);
    const currentBanner = useSelector(selectCurrentElectionBanner);
    const bannerStatus = useSelector(selectBannerStatus);
    const bannerError = useSelector(selectBannerError);

    const bannerInputRef = useRef(null);

    const [pdfLocalErrors, setPdfLocalErrors] = useState({});
    const [bannerLocalError, setBannerLocalError] = useState('');
    const [uploadingPdfKey, setUploadingPdfKey] = useState(null);
    const [isBannerUploading, setIsBannerUploading] = useState(false);
    const [pdfUploadStatuses, setPdfUploadStatuses] = useState({});
    const [bannerUploadStatus, setBannerUploadStatus] = useState(null);
    const [deletePdfDocumentKey, setDeletePdfDocumentKey] = useState(null);
    const [isDeleteBannerModalOpen, setIsDeleteBannerModalOpen] =
        useState(false);
    const [bannerTitle, setBannerTitle] = useState(DEFAULT_BANNER_TITLE);
    const [isBannerVisible, setIsBannerVisible] = useState(true);

    useEffect(() => {
        dispatch(fetchElectionPdfs());
        dispatch(fetchCurrentElectionBanner());
    }, [dispatch]);

    useEffect(() => {
        return () => {
            dispatch(clearElectionsPdfError());
            dispatch(clearElectionsBannerError());
        };
    }, [dispatch]);

    useEffect(() => {
        if (currentBanner) {
            setBannerTitle(currentBanner.title || DEFAULT_BANNER_TITLE);
            setIsBannerVisible(Boolean(currentBanner.isVisible));
        }
    }, [currentBanner]);

    useEffect(() => {
        const successEntries = Object.entries(pdfUploadStatuses).filter(
            ([, status]) => status?.status === 'success',
        );

        if (!successEntries.length) {
            return undefined;
        }

        const timer = setTimeout(() => {
            setPdfUploadStatuses((prev) => {
                const next = { ...prev };
                successEntries.forEach(([documentKey]) => {
                    if (next[documentKey]?.status === 'success') {
                        delete next[documentKey];
                    }
                });
                return next;
            });
        }, SUCCESS_INDICATOR_DURATION_MS);

        return () => clearTimeout(timer);
    }, [pdfUploadStatuses]);

    useEffect(() => {
        if (bannerUploadStatus?.status !== 'success') {
            return undefined;
        }

        const timer = setTimeout(() => {
            setBannerUploadStatus(null);
        }, SUCCESS_INDICATOR_DURATION_MS);

        return () => clearTimeout(timer);
    }, [bannerUploadStatus]);

    const isPdfLoading = pdfStatus === 'loading';
    const isBannerLoading = bannerStatus === 'loading';

    const uploadPdfFile = (documentKey, file) => {
        const formData = new FormData();
        formData.append('pdf', file);

        setUploadingPdfKey(documentKey);
        setPdfLocalErrors((prev) => ({ ...prev, [documentKey]: '' }));
        setPdfUploadStatuses((prev) => ({
            ...prev,
            [documentKey]: { status: 'uploading', fileName: file.name },
        }));

        dispatch(uploadElectionPdf({ documentKey, formData }))
            .unwrap()
            .then(() => {
                setPdfUploadStatuses((prev) => ({
                    ...prev,
                    [documentKey]: {
                        status: 'success',
                        fileName: file.name,
                    },
                }));
            })
            .catch((uploadError) => {
                setPdfUploadStatuses((prev) => {
                    const next = { ...prev };
                    delete next[documentKey];
                    return next;
                });
                setPdfLocalErrors((prev) => ({
                    ...prev,
                    [documentKey]:
                        uploadError?.error || 'Не удалось загрузить PDF-файл',
                }));
            })
            .finally(() => {
                setUploadingPdfKey(null);
            });
    };

    const uploadBannerFile = (file) => {
        const formData = new FormData();
        formData.append('banner', file);
        formData.append('title', bannerTitle.trim() || DEFAULT_BANNER_TITLE);
        formData.append('isVisible', isBannerVisible ? 'true' : 'false');

        setIsBannerUploading(true);
        setBannerUploadStatus({ status: 'uploading', fileName: file.name });

        dispatch(uploadElectionBanner(formData))
            .unwrap()
            .then(() => {
                setBannerUploadStatus({
                    status: 'success',
                    fileName: file.name,
                });
                if (bannerInputRef.current) {
                    bannerInputRef.current.value = '';
                }
            })
            .catch((uploadError) => {
                setBannerUploadStatus(null);
                setBannerLocalError(
                    uploadError?.error ||
                        'Не удалось загрузить изображение баннера',
                );
                if (bannerInputRef.current) {
                    bannerInputRef.current.value = '';
                }
            })
            .finally(() => {
                setIsBannerUploading(false);
            });
    };

    const handleBannerChange = (e) => {
        const file = e.target.files?.[0];
        setBannerLocalError('');

        if (!file) {
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

        if (
            !allowedTypes.includes(file.type) &&
            !['.jpg', '.jpeg', '.png'].includes(ext)
        ) {
            setBannerLocalError('Допустимы только форматы JPG и PNG');
            e.target.value = '';
            return;
        }

        if (isBannerUploading) {
            e.target.value = '';
            return;
        }

        uploadBannerFile(file);
    };

    const handleSaveBannerSettings = () => {
        const trimmedTitle = bannerTitle.trim();

        if (!trimmedTitle) {
            setBannerLocalError('Заголовок баннера не может быть пустым');
            return;
        }

        if (trimmedTitle.length > 100) {
            setBannerLocalError(
                'Заголовок не должен превышать 100 символов',
            );
            return;
        }

        dispatch(
            updateElectionBannerSettings({
                title: trimmedTitle,
                isVisible: isBannerVisible,
            }),
        )
            .unwrap()
            .catch((updateError) => {
                setBannerLocalError(
                    updateError?.error ||
                        'Не удалось сохранить настройки баннера',
                );
            });
    };

    const handleConfirmDeletePdf = () => {
        if (!deletePdfDocumentKey) {
            return;
        }

        dispatch(deleteElectionPdf(deletePdfDocumentKey))
            .unwrap()
            .then(() => {
                setPdfUploadStatuses((prev) => {
                    const next = { ...prev };
                    delete next[deletePdfDocumentKey];
                    return next;
                });
                setDeletePdfDocumentKey(null);
            })
            .catch((deleteError) => {
                setPdfLocalErrors((prev) => ({
                    ...prev,
                    [deletePdfDocumentKey]:
                        deleteError?.error || 'Не удалось удалить PDF-файл',
                }));
                setDeletePdfDocumentKey(null);
            });
    };

    const handleConfirmDeleteBanner = () => {
        dispatch(deleteElectionBannerImage())
            .unwrap()
            .then(() => {
                setBannerUploadStatus(null);
                setIsDeleteBannerModalOpen(false);
            })
            .catch((deleteError) => {
                setBannerLocalError(
                    deleteError?.error ||
                        'Не удалось удалить изображение баннера',
                );
                setIsDeleteBannerModalOpen(false);
            });
    };

    const bannerDisplayError = bannerLocalError || bannerError?.error;
    const hasBannerImage = Boolean(currentBanner?.url);

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Выборы</h1>
            </div>

            <div className={styles.cards}>
                <div className={styles.card}>
                    <h2>Управление PDF-файлами</h2>
                    <p className={styles.description}>
                        Для раздела «Выборы» используются два PDF-документа.
                        Каждый файл загружается и заменяется отдельно.
                    </p>

                    {pdfError?.error && (
                        <p className={styles.error}>{pdfError.error}</p>
                    )}

                    <div className={styles.pdfCards}>
                        {ELECTION_PDF_DOCUMENTS.map((document) => {
                            const currentPdf = electionPdfs.find(
                                (pdf) => pdf.documentKey === document.documentKey,
                            );

                            return (
                                <ElectionPdfUploadCard
                                    key={document.documentKey}
                                    documentKey={document.documentKey}
                                    title={document.title}
                                    currentPdf={currentPdf}
                                    isUploading={
                                        uploadingPdfKey === document.documentKey
                                    }
                                    uploadStatus={
                                        pdfUploadStatuses[document.documentKey]
                                    }
                                    error={
                                        pdfLocalErrors[document.documentKey]
                                    }
                                    onUpload={uploadPdfFile}
                                    onDelete={setDeletePdfDocumentKey}
                                    isDeletingDisabled={isPdfLoading}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className={styles.card}>
                    <h2>Управление баннером</h2>
                    <p className={styles.description}>
                        Загрузите изображение баннера и настройте его
                        отображение на сайте. Заголовок можно изменить, например,
                        на «Выборы 2027».
                    </p>

                    <div className={styles.settingsBlock}>
                        <label htmlFor="banner-title">Заголовок баннера</label>
                        <input
                            id="banner-title"
                            type="text"
                            value={bannerTitle}
                            onChange={(e) => {
                                setBannerLocalError('');
                                setBannerTitle(e.target.value);
                            }}
                            className={styles.textInput}
                            maxLength={100}
                            placeholder={DEFAULT_BANNER_TITLE}
                        />

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={isBannerVisible}
                                onChange={(e) => {
                                    setBannerLocalError('');
                                    setIsBannerVisible(e.target.checked);
                                }}
                                className={styles.checkboxInput}
                            />
                            <span className={styles.checkboxCustom} />
                            Отображать баннер на сайте
                        </label>
                        <p className={styles.hint}>
                            Баннер на главной показывается только при
                            включённом переключателе и загруженном изображении.
                        </p>

                        <button
                            className={styles.saveButton}
                            onClick={handleSaveBannerSettings}
                            disabled={isBannerLoading}
                        >
                            Сохранить настройки
                        </button>
                    </div>

                    {hasBannerImage ? (
                        <div className={styles.bannerPreview}>
                            <span className={styles.label}>
                                Текущее изображение:
                            </span>
                            <img
                                src={currentBanner.url}
                                alt={currentBanner.originalFilename}
                                className={styles.bannerImage}
                            />
                            <span className={styles.fileName}>
                                {currentBanner.originalFilename}
                            </span>
                        </div>
                    ) : (
                        <p className={styles.emptyState}>
                            Изображение баннера ещё не загружено
                        </p>
                    )}

                    <div className={styles.uploadBlock}>
                        <label htmlFor="election-banner-input">
                            {hasBannerImage
                                ? 'Заменить изображение баннера'
                                : 'Выберите изображение баннера'}
                        </label>
                        <input
                            id="election-banner-input"
                            ref={bannerInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                            onChange={handleBannerChange}
                            disabled={isBannerUploading}
                            className={styles.fileInput}
                        />
                    </div>

                    <UploadStatusIndicator
                        status={bannerUploadStatus?.status}
                        fileName={bannerUploadStatus?.fileName}
                    />

                    {bannerDisplayError && (
                        <p className={styles.error}>{bannerDisplayError}</p>
                    )}

                    {hasBannerImage && (
                        <div className={styles.actions}>
                            <button
                                className={styles.deleteButton}
                                onClick={() =>
                                    setIsDeleteBannerModalOpen(true)
                                }
                                disabled={isBannerLoading}
                            >
                                Удалить изображение
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDeleteModal
                isOpen={Boolean(deletePdfDocumentKey)}
                onClose={() => setDeletePdfDocumentKey(null)}
                onConfirm={handleConfirmDeletePdf}
                description="Вы уверены, что хотите удалить этот PDF-файл?"
            />

            <ConfirmDeleteModal
                isOpen={isDeleteBannerModalOpen}
                onClose={() => setIsDeleteBannerModalOpen(false)}
                onConfirm={handleConfirmDeleteBanner}
                description="Вы уверены, что хотите удалить изображение баннера?"
            />
        </div>
    );
};
