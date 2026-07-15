import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { UploadStatusIndicator } from './UploadStatusIndicator';
import styles from './ElectionsSection.module.scss';

export const ElectionPdfUploadCard = ({
    documentKey,
    title,
    currentPdf,
    isUploading,
    uploadStatus,
    error,
    onUpload,
    onDelete,
    isDeletingDisabled,
}) => {
    const inputRef = useRef(null);
    const [validationError, setValidationError] = useState('');
    const hasFile = Boolean(currentPdf?.url);
    const displayError = validationError || error;

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        setValidationError('');

        if (!file) {
            return;
        }

        if (
            file.type !== 'application/pdf' &&
            !file.name.toLowerCase().endsWith('.pdf')
        ) {
            setValidationError('Допустим только формат PDF');
            event.target.value = '';
            return;
        }

        if (isUploading) {
            event.target.value = '';
            return;
        }

        onUpload(documentKey, file);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className={styles.pdfCard}>
            <h3 className={styles.pdfCardTitle}>{title}</h3>

            {hasFile ? (
                <div className={styles.currentFile}>
                    <span className={styles.label}>Текущий файл:</span>
                    <span className={styles.fileName}>
                        {currentPdf.originalFilename}
                    </span>
                    <a
                        className={styles.downloadButton}
                        href={currentPdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Открыть
                    </a>
                </div>
            ) : (
                <p className={styles.emptyState}>PDF-файл ещё не загружен</p>
            )}

            <div className={styles.uploadBlock}>
                <label htmlFor={`election-pdf-input-${documentKey}`}>
                    {hasFile ? 'Заменить PDF-файл' : 'Выберите PDF-файл'}
                </label>
                <input
                    id={`election-pdf-input-${documentKey}`}
                    ref={inputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className={styles.fileInput}
                />
            </div>

            <UploadStatusIndicator
                status={uploadStatus?.status}
                fileName={uploadStatus?.fileName}
            />

            {displayError && <p className={styles.error}>{displayError}</p>}

            {hasFile && (
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => onDelete(documentKey)}
                        disabled={isDeletingDisabled}
                    >
                        Удалить файл
                    </button>
                </div>
            )}
        </div>
    );
};

ElectionPdfUploadCard.propTypes = {
    documentKey: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    currentPdf: PropTypes.object,
    isUploading: PropTypes.bool,
    uploadStatus: PropTypes.shape({
        status: PropTypes.oneOf(['uploading', 'success']),
        fileName: PropTypes.string,
    }),
    error: PropTypes.string,
    onUpload: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    isDeletingDisabled: PropTypes.bool,
};
