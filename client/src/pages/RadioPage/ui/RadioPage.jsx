import React, { memo, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAllRadio,
    fetchRadioById,
} from '@entities/radio/model/radioSlice';
import { fetchAllNews } from '@entities/news/model/newsSlice';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import {
    selectNewsList,
    selectNewsLoading,
} from '@entities/news/model/newsSelectors';
import { selectCategories } from '@entities/categories/model/categorySelectors';
import { RadioPlayer } from '@features/radio/index.js';
import { Sidebar } from '@widgets/Sidebar/index.js';
import styles from './RadioPage.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';
import radioImage from '@assets/radio.jpg'


const RadioPage = memo(() => {
    const dispatch = useDispatch();
    const newsList = useSelector(selectNewsList);
    const categories = useSelector(selectCategories);
    const loading = useSelector(selectNewsLoading);
    const { radio, currentRadio, status, error } = useSelector(
        (state) => state.radio
    );

    const fetchData = useCallback(() => {
        if (status === 'idle') dispatch(fetchAllRadio());
        if (!newsList.length) dispatch(fetchAllNews());
        if (!categories.length) dispatch(fetchCategories());
    }, [status, dispatch, newsList, categories]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePlay = useCallback(
        (id) => dispatch(fetchRadioById(id)),
        [dispatch]
    );
    const handleStop = useCallback(() => dispatch({ type: 'radio/stop' }), [
        dispatch,
    ]);

    if (loading) {
        return <Loader />;
    }

    return (
        <div className={styles.radioPage}>
            <div className={styles.radioPlayerWrapper}>
                <img alt='Радио России "Ингушетия"' className={styles.radioImage} src={radioImage}/>

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
                <Sidebar categories={categories} newsList={newsList} />
            </div>
        </div>
    );
});

export default RadioPage;
