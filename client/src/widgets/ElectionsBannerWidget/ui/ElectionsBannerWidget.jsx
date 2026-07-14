import { memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentElectionBanner } from '@entities/elections/model/electionsSlice';
import { selectCurrentElectionBanner } from '@entities/elections/model/electionsSelectors';
import styles from './ElectionsBannerWidget.module.scss';

export const ElectionsBannerWidget = memo(() => {
    const dispatch = useDispatch();
    const banner = useSelector(selectCurrentElectionBanner);

    useEffect(() => {
        dispatch(fetchCurrentElectionBanner());
    }, [dispatch]);

    if (!banner?.isVisible || !banner?.url) {
        return null;
    }

    return (
        <Link to="/elections" className={styles.banner}>
            <img
                src={banner.url}
                alt={banner.title}
                className={styles.image}
            />
            <div className={styles.overlay}>
                <h3 className={styles.title}>{banner.title}</h3>
            </div>
        </Link>
    );
});
