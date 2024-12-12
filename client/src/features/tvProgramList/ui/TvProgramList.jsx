import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllTvPrograms } from '@entities/tvProgram/model/tvProgramSlice';
import {
    selectAllTvPrograms,
    selectTvProgramStatus,
} from '@entities/tvProgram/model/tvProgramSelectors';
import styles from './TvProgramList.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';

export const TvProgramList = () => {
    const dispatch = useDispatch();
    const tvPrograms = useSelector(selectAllTvPrograms);
    const [showAllPrograms, setShowAllPrograms] = useState(false);
    const loading = useSelector(selectTvProgramStatus);

    useEffect(() => {
        dispatch(fetchAllTvPrograms());
    }, [dispatch]);

    const formatProgramText = (text) => {
        return text.replace(/\n/g, '<br>');
    };

    const toggleShowAllPrograms = () => {
        setShowAllPrograms((prev) => !prev);
    };

    const latestProgram =
        tvPrograms.length > 0 ? tvPrograms[tvPrograms.length - 1] : null;
    const archivePrograms =
        tvPrograms.length > 1 ? tvPrograms.slice(0, -1).reverse() : [];

    if (loading.status === 'loading') {
        return <Loader />;
    }
    return (
        <div className={styles.tvProgramList}>
            <h1>Текущая программа</h1>
            {latestProgram && (
                <div className={styles.programSection}>
                    <div
                        className={styles.programContent}
                        dangerouslySetInnerHTML={{
                            __html: formatProgramText(latestProgram.program),
                        }}
                    />
                </div>
            )}

            {showAllPrograms && (
                <div className={styles.archiveSection}>
                    <h2>Архивные расписания</h2>
                    {archivePrograms.map((program) => (
                        <div key={program.id} className={styles.programSection}>
                            <div
                                className={styles.programContent}
                                dangerouslySetInnerHTML={{
                                    __html: formatProgramText(program.program),
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            <button
                className={styles.archiveButton}
                onClick={toggleShowAllPrograms}
            >
                {showAllPrograms
                    ? 'Скрыть архив'
                    : 'Показать архивные расписания'}
            </button>
        </div>
    );
};
