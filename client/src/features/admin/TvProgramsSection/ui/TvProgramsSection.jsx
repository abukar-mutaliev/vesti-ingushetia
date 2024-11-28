import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAllTvPrograms,
    deleteTvProgram,
} from '@entities/tvProgram/model/tvProgramSlice';
import { selectAllTvPrograms } from '@entities/tvProgram/model/tvProgramSelectors';
import styles from './tvProgramsSection.module.scss';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal';

export const TvProgramsSection = ({ onEditTvProgram, onAddTvProgram }) => {
    const dispatch = useDispatch();
    const tvPrograms = useSelector(selectAllTvPrograms);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [scheduleIdToDelete, setScheduleIdToDelete] = useState(null);

    useEffect(() => {
        dispatch(fetchAllTvPrograms());
    }, [dispatch]);

    const openDeleteModal = (id) => {
        setScheduleIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setScheduleIdToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (scheduleIdToDelete) {
            dispatch(deleteTvProgram(scheduleIdToDelete))
                .unwrap()
                .then(() => {
                    dispatch(fetchAllTvPrograms());
                    closeDeleteModal();
                });
        }
    };

    const getShortText = (text) => {
        const sentences = text.split('.').slice(0, 5).join('. ') + '.';
        return sentences;
    };

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Расписание передач</h1>
                <button className={styles.create} onClick={onAddTvProgram}>
                    + Добавить расписание
                </button>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.hideOnMobile}>Id</th>
                        <th>Программа</th>
                        <th>Редактировать</th>
                        <th>Удалить</th>
                    </tr>
                </thead>
                <tbody>
                    {tvPrograms && tvPrograms.length > 0 ? (
                        tvPrograms.map((program) => (
                            <tr key={program.id}>
                                <td className={styles.hideOnMobile}>
                                    {program.id}
                                </td>
                                <td>
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: getShortText(
                                                program.program,
                                            ),
                                        }}
                                    />
                                </td>
                                <td>
                                    <button
                                        className={styles.editButton}
                                        onClick={() => onEditTvProgram(program)}
                                    >
                                        Изменить
                                    </button>
                                </td>
                                <td>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() =>
                                            openDeleteModal(program.id)
                                        }
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td>
                                <span>Нет доступных телепрограмм.</span>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                description="Вы уверены, что хотите удалить это расписание?"
            />
        </div>
    );
};
