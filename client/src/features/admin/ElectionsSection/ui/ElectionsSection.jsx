import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchElectionPdfs,
    createElectionPdf,
    uploadElectionPdf,
    updateElectionPdfTitle,
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
import { MAX_ELECTION_PDFS } from '@entities/elections/model/electionPdfDocuments';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';
import {
    AddElectionPdfCard,
    ElectionPdfUploadCard,
} from './ElectionPdfUploadCard';
import { UploadStatusIndicator } from './UploadStatusIndicator';
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
    const [uploadingPdfId, setUploadingPdfId] = useState(null);
    const [savingTitlePdfId, setSavingTitlePdfId] = useState(null);
    const [isBannerUploading, setIsBannerUploading] = useState(false);
    const [pdfUploadStatuses, setPdfUploadStatuses] = useState({});
    const [bannerUploadStatus, setBannerUploadStatus] = useState(null);
    const [deletePdfId, setDeletePdfId] = useState(null);
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
                successEntries.forEach(([pdfKey]) => {
                    if (next[pdfKey]?.status === 'success') {
                        delete next[pdfKey];
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

    const remainingPdfCount = MAX_ELECTION_PDFS - electionPdfs.length;

    const uploadPdfFile = (pdfId, file, title) => {
        const formData = new FormData();
        formData.append('pdf', file);

        if (title) {
            formData.append('title', title);
        }

        setUploadingPdfId(pdfId);
        setPdfLocalErrors((prev) => ({ ...prev, [pdfId]: '' }));
        setPdfUploadStatuses((prev) => ({
            ...prev,
            [pdfId]: { status: 'uploading', fileName: file.name },
        }));

        dispatch(uploadElectionPdf({ id: pdfId, formData }))
            .unwrap()
            .then(() => {
                setPdfUploadStatuses((prev) => ({
                    ...prev,
                    [pdfId]: {
                        status: 'success',
                        fileName: file.name,
                    },
                }));
            })
            .catch((uploadError) => {
                setPdfUploadStatuses((prev) => {
                    const next = { ...prev };
                    delete next[pdfId];
                    return next;
                });
                setPdfLocalErrors((prev) => ({
                    ...prev,
                    [pdfId]:
                        uploadError?.error || 'Не удалось загрузить PDF-файл',
                }));
            })
            .finally(() => {
                setUploadingPdfId(null);
            });
    };

    const createPdfFile = (file, title) => {
        const formData = new FormData();
        formData.append('pdf', file);

        if (title) {
            formData.append('title', title);
        }

        setUploadingPdfId('new');
        setPdfLocalErrors((prev) => ({ ...prev, new: '' }));
        setPdfUploadStatuses((prev) => ({
            ...prev,
            new: { status: 'uploading', fileName: file.name },
        }));

        dispatch(createElectionPdf({ formData }))
            .unwrap()
            .then(() => {
                setPdfUploadStatuses((prev) => ({
                    ...prev,
                    new: {
                        status: 'success',
                        fileName: file.name,
                    },
                }));
            })
            .catch((uploadError) => {
                setPdfUploadStatuses((prev) => {
                    const next = { ...prev };
                    delete next.new;
                    return next;
                });
                setPdfLocalErrors((prev) => ({
                    ...prev,
                    new:
                        uploadError?.error || 'Не удалось загрузить PDF-файл',
                }));
            })
            .finally(() => {
                setUploadingPdfId(null);
            });
    };

    const savePdfTitle = (pdfId, title) => {
        setSavingTitlePdfId(pdfId);
        setPdfLocalErrors((prev) => ({ ...prev, [pdfId]: '' }));

        dispatch(updateElectionPdfTitle({ id: pdfId, title }))
            .unwrap()
            .catch((updateError) => {
                setPdfLocalErrors((prev) => ({
                    ...prev,
                    [pdfId]:
                        updateError?.error ||
                        'Не удалось сохранить название документа',
                }));
            })
            .finally(() => {
                setSavingTitlePdfId(null);
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
        if (!deletePdfId) {
            return;
        }

        dispatch(deleteElectionPdf(deletePdfId))
            .unwrap()
            .then(() => {
                setPdfUploadStatuses((prev) => {
                    const next = { ...prev };
                    delete next[deletePdfId];
                    return next;
                });
                setDeletePdfId(null);
            })
            .catch((deleteError) => {
                setPdfLocalErrors((prev) => ({
                    ...prev,
                    [deletePdfId]:
                        deleteError?.error || 'Не удалось удалить PDF-файл',
                }));
                setDeletePdfId(null);
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
                        Можно загрузить до {MAX_ELECTION_PDFS} PDF-документов.
                        Для каждого документа задаётся название, которое
                        отображается на сайте.
                    </p>

                    {pdfError?.error && (
                        <p className={styles.error}>{pdfError.error}</p>
                    )}

                    <div className={styles.pdfCards}>
                        {electionPdfs.map((pdf) => (
                            <ElectionPdfUploadCard
                                key={pdf.id}
                                pdf={pdf}
                                isUploading={uploadingPdfId === pdf.id}
                                isSavingTitle={savingTitlePdfId === pdf.id}
                                uploadStatus={pdfUploadStatuses[pdf.id]}
                                error={pdfLocalErrors[pdf.id]}
                                onUpload={uploadPdfFile}
                                onDelete={setDeletePdfId}
                                onSaveTitle={savePdfTitle}
                                isDeletingDisabled={isPdfLoading}
                            />
                        ))}

                        {remainingPdfCount > 0 && (
                            <AddElectionPdfCard
                                isUploading={uploadingPdfId === 'new'}
                                uploadStatus={pdfUploadStatuses.new}
                                error={pdfLocalErrors.new}
                                onCreate={createPdfFile}
                                remainingCount={remainingPdfCount}
                            />
                        )}
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
                isOpen={Boolean(deletePdfId)}
                onClose={() => setDeletePdfId(null)}
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
