import { memo, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAllRadio,
    fetchRadioById,
    stop,
} from '@entities/radio/model/radioSlice';
import { fetchAllNews } from '@entities/news/model/newsSlice';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import {
    selectNewsList,
    selectNewsLoading,
} from '@entities/news/model/newsSelectors';
import { selectCategories } from '@entities/categories/model/categorySelectors';
import {
    selectRadioList,
    selectCurrentRadio,
    selectRadioStatus,
    selectRadioError,
} from '@entities/radio/model/radioSelectors';
import { RadioPlayer } from '@features/radio/index.js';
import { Sidebar } from '@widgets/Sidebar/index.js';
import styles from './RadioPage.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';
import radioImage from '@assets/radio.jpg';

const RadioPage = memo(() => {
    const dispatch = useDispatch();

    const newsList = useSelector(selectNewsList);
    const categories = useSelector(selectCategories);
    const loadingNews = useSelector(selectNewsLoading);
    const radio = useSelector(selectRadioList);
    const currentRadio = useSelector(selectCurrentRadio);
    const status = useSelector(selectRadioStatus);
    const error = useSelector(selectRadioError);

    const memoizedNewsList = useMemo(() => newsList, [newsList]);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchAllRadio());
        }
        if (!newsList.length && !loadingNews) {
            dispatch(fetchAllNews());
        }
        if (!categories.length) {
            dispatch(fetchCategories());
        }
    }, [
        dispatch,
        status,
        newsList.length,
        loadingNews,
        categories.length,
        radio.length,
    ]);

    const handlePlay = useCallback(
        (id) => dispatch(fetchRadioById(id)),
        [dispatch],
    );

    const handleStop = useCallback(() => dispatch(stop()), [dispatch]);

    if (loadingNews) {
        return <Loader />;
    }

    if (error) {
        return <div className={styles.error}>Ошибка: {error}</div>;
    }

    return (
        <div className={styles.radioPage}>
            <div className={styles.radioPlayerWrapper}>
                <img
                    alt='Радио России "Ингушетия"'
                    className={styles.radioImage}
                    src={radioImage}
                />

                <RadioPlayer
                    radio={radio}
                    currentRadio={currentRadio}
                    status={status}
                    error={error}
                    onPlay={handlePlay}
                    onStop={handleStop}
                />
            </div>
            <div className={styles.sidebarWrapper}>
                <Sidebar categories={categories} newsList={memoizedNewsList} />
            </div>
        </div>
    );
});

export default RadioPage;
