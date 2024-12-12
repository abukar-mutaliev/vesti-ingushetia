import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAllRadio,
    deleteRadio,
} from '@entities/radio/model/radioSlice.js';
import { selectRadioList } from '@entities/radio/model/radioSelectors.js';
import styles from './RadioSection.module.scss';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal/index.js';

export const RadioSection = ({ onEditRadio, onAddRadio }) => {
    const dispatch = useDispatch();
    const radioList = useSelector(selectRadioList);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [radioIdToDelete, setRadioIdToDelete] = useState(null);

    useEffect(() => {
        dispatch(fetchAllRadio());
    }, [dispatch]);

    const openDeleteModal = (id) => {
        setRadioIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setRadioIdToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (radioIdToDelete) {
            dispatch(deleteRadio(radioIdToDelete))
                .unwrap()
                .then(() => {
                    dispatch(fetchAllRadio());
                    closeDeleteModal();
                });
        }
    };

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Радио</h1>
                <button className={styles.create} onClick={onAddRadio}>
                    + Добавить радио
                </button>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.hideOnMobile}>Id</th>
                        <th>Название</th>
                        <th>Редактировать</th>
                        <th>Удалить</th>
                    </tr>
                </thead>
                <tbody>
                    {radioList.map((item) => (
                        <tr key={item.id}>
                            <td className={styles.hideOnMobile}>{item.id}</td>
                            <td>{item.title}</td>
                            <td>
                                <button
                                    className={styles.editButton}
                                    onClick={() => onEditRadio(item)}
                                >
                                    Изменить
                                </button>
                            </td>
                            <td>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => openDeleteModal(item.id)}
                                >
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                description="Вы уверены что хотите удалить это радио?"
            />
        </div>
    );
};
