import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchCurrentElectionBanner,
    DEFAULT_BANNER_TITLE,
} from '@entities/elections/model/electionsSlice';
import {
    selectCurrentElectionBanner,
} from '@entities/elections/model/electionsSelectors';
import { ElectionsNewsBlock } from '@features/elections/ElectionsNewsBlock';
import { ElectionsPdfBlock } from '@features/elections/ElectionsPdfBlock';
import styles from './ElectionsPage.module.scss';

const ElectionsPage = () => {
    const dispatch = useDispatch();
    const banner = useSelector(selectCurrentElectionBanner);

    useEffect(() => {
        dispatch(fetchCurrentElectionBanner());
    }, [dispatch]);

    const pageTitle = banner?.title || DEFAULT_BANNER_TITLE;

    return (
        <div className={styles.page}>
            {banner?.isVisible && banner?.url ? (
                <div className={styles.hero}>
                    <img
                        src={banner.url}
                        alt={pageTitle}
                        className={styles.heroImage}
                    />
                    <div className={styles.heroOverlay}>
                        <h1>{pageTitle}</h1>
                    </div>
                </div>
            ) : (
                <h1 className={styles.pageTitle}>{pageTitle}</h1>
            )}

            <div className={styles.blocks}>
                <ElectionsNewsBlock />
                <ElectionsPdfBlock />
            </div>
        </div>
    );
};

export default ElectionsPage;
