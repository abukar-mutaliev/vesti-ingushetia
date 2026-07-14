import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchCurrentElectionPdf,
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
    selectCurrentElectionPdf,
    selectPdfStatus,
    selectPdfError,
    selectCurrentElectionBanner,
    selectBannerStatus,
    selectBannerError,
} from '@entities/elections/model/electionsSelectors';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';
import { UploadStatusIndicator } from './UploadStatusIndicator';
import styles from './ElectionsSection.module.scss';

const SUCCESS_INDICATOR_DURATION_MS = 4500;

export const ElectionsSection = () => {
    const dispatch = useDispatch();
    const currentPdf = useSelector(selectCurrentElectionPdf);
    const pdfStatus = useSelector(selectPdfStatus);
    const pdfError = useSelector(selectPdfError);
    const currentBanner = useSelector(selectCurrentElectionBanner);
    const bannerStatus = useSelector(selectBannerStatus);
    const bannerError = useSelector(selectBannerError);

    const pdfInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const [pdfLocalError, setPdfLocalError] = useState('');
    const [bannerLocalError, setBannerLocalError] = useState('');
    const [isPdfUploading, setIsPdfUploading] = useState(false);
    const [isBannerUploading, setIsBannerUploading] = useState(false);
    const [pdfUploadStatus, setPdfUploadStatus] = useState(null);
    const [bannerUploadStatus, setBannerUploadStatus] = useState(null);
    const [isDeletePdfModalOpen, setIsDeletePdfModalOpen] = useState(false);
    const [isDeleteBannerModalOpen, setIsDeleteBannerModalOpen] =
        useState(false);
    const [bannerTitle, setBannerTitle] = useState(DEFAULT_BANNER_TITLE);
    const [isBannerVisible, setIsBannerVisible] = useState(true);

    useEffect(() => {
        dispatch(fetchCurrentElectionPdf());
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
        if (pdfUploadStatus?.status !== 'success') {
            return undefined;
        }

        const timer = setTimeout(() => {
            setPdfUploadStatus(null);
        }, SUCCESS_INDICATOR_DURATION_MS);

        return () => clearTimeout(timer);
    }, [pdfUploadStatus]);

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

    const uploadPdfFile = (file) => {
        const formData = new FormData();
        formData.append('pdf', file);

        setIsPdfUploading(true);
        setPdfUploadStatus({ status: 'uploading', fileName: file.name });

        dispatch(uploadElectionPdf(formData))
            .unwrap()
            .then(() => {
                setPdfUploadStatus({
                    status: 'success',
                    fileName: file.name,
                });
                if (pdfInputRef.current) {
                    pdfInputRef.current.value = '';
                }
            })
            .catch((uploadError) => {
                setPdfUploadStatus(null);
                setPdfLocalError(
                    uploadError?.error || 'Не удалось загрузить PDF-файл',
                );
                if (pdfInputRef.current) {
                    pdfInputRef.current.value = '';
                }
            })
            .finally(() => {
                setIsPdfUploading(false);
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

    const handlePdfChange = (e) => {
        const file = e.target.files?.[0];
        setPdfLocalError('');

        if (!file) {
            return;
        }

        if (
            file.type !== 'application/pdf' &&
            !file.name.toLowerCase().endsWith('.pdf')
        ) {
            setPdfLocalError('Допустим только формат PDF');
            e.target.value = '';
            return;
        }

        if (isPdfUploading) {
            e.target.value = '';
            return;
        }

        uploadPdfFile(file);
    };

    const handleBannerChange = (e) => {
        const file = e.target.files?.[0];
        setBannerLocalError('');

        if (!file) {
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

        if (!allowedTypes.includes(file.type) && !['.jpg', '.jpeg', '.png'].includes(ext)) {
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
        dispatch(deleteElectionPdf())
            .unwrap()
            .then(() => {
                setPdfUploadStatus(null);
                setIsDeletePdfModalOpen(false);
            })
            .catch((deleteError) => {
                setPdfLocalError(
                    deleteError?.error || 'Не удалось удалить PDF-файл',
                );
                setIsDeletePdfModalOpen(false);
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

    const pdfDisplayError = pdfLocalError || pdfError?.error;
    const bannerDisplayError = bannerLocalError || bannerError?.error;
    const hasBannerImage = Boolean(currentBanner?.url);

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Выборы</h1>
            </div>

            <div className={styles.cards}>
                <div className={styles.card}>
                    <h2>Управление PDF-файлом</h2>
                    <p className={styles.description}>
                        В системе хранится только один актуальный PDF-файл.
                        При загрузке нового файла предыдущий будет заменён.
                    </p>

                    {currentPdf ? (
                        <div className={styles.currentFile}>
                            <span className={styles.label}>Текущий файл:</span>
                            <span className={styles.fileName}>
                                {currentPdf.originalFilename}
                            </span>
                            <a
                                className={styles.downloadButton}
                                href={currentPdf.url}
                                download={currentPdf.originalFilename}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Скачать
                            </a>
                        </div>
                    ) : (
                        <p className={styles.emptyState}>
                            PDF-файл ещё не загружен
                        </p>
                    )}

                    <div className={styles.uploadBlock}>
                        <label htmlFor="election-pdf-input">
                            {currentPdf
                                ? 'Заменить PDF-файл'
                                : 'Выберите PDF-файл'}
                        </label>
                        <input
                            id="election-pdf-input"
                            ref={pdfInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handlePdfChange}
                            disabled={isPdfUploading}
                            className={styles.fileInput}
                        />
                    </div>

                    <UploadStatusIndicator
                        status={pdfUploadStatus?.status}
                        fileName={pdfUploadStatus?.fileName}
                    />

                    {pdfDisplayError && (
                        <p className={styles.error}>{pdfDisplayError}</p>
                    )}

                    {currentPdf && (
                        <div className={styles.actions}>
                            <button
                                className={styles.deleteButton}
                                onClick={() => setIsDeletePdfModalOpen(true)}
                                disabled={isPdfLoading}
                            >
                                Удалить файл
                            </button>
                        </div>
                    )}
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
                isOpen={isDeletePdfModalOpen}
                onClose={() => setIsDeletePdfModalOpen(false)}
                onConfirm={handleConfirmDeletePdf}
                description="Вы уверены, что хотите удалить текущий PDF-файл?"
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
