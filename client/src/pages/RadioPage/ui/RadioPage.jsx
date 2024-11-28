import React, { useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
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

export const RadioPage = () => {
    const dispatch = useDispatch();
    const newsList = useSelector(selectNewsList, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);
    const loading = useSelector(selectNewsLoading);
    const { radio, currentRadio, status, error } = useSelector(
        (state) => state.radio,
    );

    useEffect(() => {
        if (status === 'idle') dispatch(fetchAllRadio());
        if (!newsList.length) dispatch(fetchAllNews());
        if (!categories.length) dispatch(fetchCategories());
    }, [status, dispatch, newsList, categories]);

    const handlePlay = (id) => dispatch(fetchRadioById(id));
    const handleStop = () => dispatch({ type: 'radio/stop' });

    if (loading) {
        return <Loader />;
    }

    return (
        <div className={styles.radioPage}>
            <div className={styles.radioPlayerWrapper}>
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
};
