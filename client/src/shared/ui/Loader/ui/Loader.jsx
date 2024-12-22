import { PuffLoader } from 'react-spinners';
import PropTypes from 'prop-types';
import styles from './Loader.module.scss';

export const Loader = ({ size = 80, fullScreen = false, style = {} }) => {
    return (
        <div
            className={`${styles.loaderContainer} ${fullScreen ? styles.fullScreen : ''}`}
            style={style}
        >
            <PuffLoader
                color="#007bff"
                size={size}
                aria-label="Loading Spinner"
            />
        </div>
    );
};

Loader.propTypes = {
    size: PropTypes.number,
    fullScreen: PropTypes.bool,
    style: PropTypes.object,
};
