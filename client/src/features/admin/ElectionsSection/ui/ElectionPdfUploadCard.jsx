import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { UploadStatusIndicator } from './UploadStatusIndicator';
import styles from './ElectionsSection.module.scss';

export const ElectionPdfUploadCard = ({
    pdf,
    isUploading,
    isSavingTitle,
    uploadStatus,
    error,
    onUpload,
    onDelete,
    onSaveTitle,
    isDeletingDisabled,
}) => {
    const inputRef = useRef(null);
    const [validationError, setValidationError] = useState('');
    const [title, setTitle] = useState(pdf.title);
    const displayError = validationError || error;

    useEffect(() => {
        setTitle(pdf.title);
    }, [pdf.title]);

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

        onUpload(pdf.id, file, title.trim());

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleSaveTitle = () => {
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setValidationError('Название документа не может быть пустым');
            return;
        }

        setValidationError('');
        onSaveTitle(pdf.id, trimmedTitle);
    };

    return (
        <div className={styles.pdfCard}>
            <label htmlFor={`election-pdf-title-${pdf.id}`}>
                Название документа
            </label>
            <input
                id={`election-pdf-title-${pdf.id}`}
                type="text"
                value={title}
                onChange={(event) => {
                    setValidationError('');
                    setTitle(event.target.value);
                }}
                className={styles.textInput}
                maxLength={500}
            />

            <div className={styles.currentFile}>
                <span className={styles.label}>Текущий файл:</span>
                <span className={styles.fileName}>{pdf.originalFilename}</span>
                <a
                    className={styles.downloadButton}
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Открыть
                </a>
            </div>

            <div className={styles.uploadBlock}>
                <label htmlFor={`election-pdf-input-${pdf.id}`}>
                    Заменить PDF-файл
                </label>
                <input
                    id={`election-pdf-input-${pdf.id}`}
                    ref={inputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className={styles.fileInput}
                />
            </div>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.saveButton}
                    onClick={handleSaveTitle}
                    disabled={isSavingTitle || isUploading}
                >
                    Сохранить название
                </button>
                <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => onDelete(pdf.id)}
                    disabled={isDeletingDisabled}
                >
                    Удалить документ
                </button>
            </div>

            <UploadStatusIndicator
                status={uploadStatus?.status}
                fileName={uploadStatus?.fileName}
            />

            {displayError && <p className={styles.error}>{displayError}</p>}
        </div>
    );
};

ElectionPdfUploadCard.propTypes = {
    pdf: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
        originalFilename: PropTypes.string.isRequired,
    }).isRequired,
    isUploading: PropTypes.bool,
    isSavingTitle: PropTypes.bool,
    uploadStatus: PropTypes.shape({
        status: PropTypes.oneOf(['uploading', 'success']),
        fileName: PropTypes.string,
    }),
    error: PropTypes.string,
    onUpload: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onSaveTitle: PropTypes.func.isRequired,
    isDeletingDisabled: PropTypes.bool,
};

export const AddElectionPdfCard = ({
    isUploading,
    uploadStatus,
    error,
    onCreate,
    remainingCount,
}) => {
    const inputRef = useRef(null);
    const [validationError, setValidationError] = useState('');
    const [title, setTitle] = useState('');
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

        onCreate(file, title.trim());

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className={styles.pdfCard}>
            <h3 className={styles.pdfCardTitle}>Добавить PDF-документ</h3>
            <p className={styles.hint}>
                Можно добавить ещё {remainingCount}{' '}
                {remainingCount === 1 ? 'документ' : 'документов'} (максимум 15)
            </p>

            <label htmlFor="election-pdf-new-title">Название документа</label>
            <input
                id="election-pdf-new-title"
                type="text"
                value={title}
                onChange={(event) => {
                    setValidationError('');
                    setTitle(event.target.value);
                }}
                className={styles.textInput}
                maxLength={500}
                placeholder="Если не указать, будет использовано имя файла"
            />

            <div className={styles.uploadBlock}>
                <label htmlFor="election-pdf-new-input">Выберите PDF-файл</label>
                <input
                    id="election-pdf-new-input"
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
        </div>
    );
};

AddElectionPdfCard.propTypes = {
    isUploading: PropTypes.bool,
    uploadStatus: PropTypes.shape({
        status: PropTypes.oneOf(['uploading', 'success']),
        fileName: PropTypes.string,
    }),
    error: PropTypes.string,
    onCreate: PropTypes.func.isRequired,
    remainingCount: PropTypes.number.isRequired,
};
