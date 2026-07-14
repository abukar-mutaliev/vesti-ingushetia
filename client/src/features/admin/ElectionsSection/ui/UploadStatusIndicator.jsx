import PropTypes from 'prop-types';
import styles from './UploadStatusIndicator.module.scss';

export const UploadStatusIndicator = ({ status, fileName }) => {
    if (!status) {
        return null;
    }

    const isUploading = status === 'uploading';
    const isSuccess = status === 'success';

    return (
        <div
            className={`${styles.indicator} ${isUploading ? styles.loading : ''} ${isSuccess ? styles.success : ''}`}
            role="status"
            aria-live="polite"
        >
            <div className={styles.iconWrap}>
                {isUploading ? (
                    <span className={styles.spinner} aria-hidden="true" />
                ) : (
                    <svg
                        className={styles.checkIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12.5l2.5 2.5L16 9" />
                    </svg>
                )}
            </div>

            <div className={styles.content}>
                <span className={styles.title}>
                    {isUploading ? 'Загрузка файла...' : 'Файл успешно загружен'}
                </span>
                {fileName && (
                    <span className={styles.fileName}>{fileName}</span>
                )}
                {isUploading && (
                    <div className={styles.progressTrack}>
                        <div className={styles.progressFill} />
                    </div>
                )}
            </div>
        </div>
    );
};

UploadStatusIndicator.propTypes = {
    status: PropTypes.oneOf(['uploading', 'success']),
    fileName: PropTypes.string,
};
