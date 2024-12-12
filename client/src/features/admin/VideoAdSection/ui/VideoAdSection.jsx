import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAllVideoAds,
    deleteVideoAd,
    pauseVideoAd,
    activateVideoAd,
} from '@entities/videoAd/model/videoAdSlice';
import { selectAllVideoAds } from '@entities/videoAd/model/videoAdSelectors';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal';
import styles from './VideoAdSection.module.scss';

export const VideoAdSection = ({ onAddVideoAd, onEditVideoAd }) => {
    const dispatch = useDispatch();
    const videoAds = useSelector(selectAllVideoAds);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [videoAdIdToDelete, setVideoAdIdToDelete] = useState(null);

    useEffect(() => {
        dispatch(fetchAllVideoAds());
    }, [dispatch]);

    const openDeleteModal = (id) => {
        setVideoAdIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setVideoAdIdToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (videoAdIdToDelete) {
            dispatch(deleteVideoAd(videoAdIdToDelete))
                .unwrap()
                .then(() => {
                    dispatch(fetchAllVideoAds());
                    closeDeleteModal();
                });
        }
    };

    const handlePause = (id) => {
        dispatch(pauseVideoAd(id)).unwrap();
        dispatch(fetchAllVideoAds()).catch((error) => {
            console.error('Ошибка при приостановке видеорекламы:', error);
        });
    };

    const handleActivate = (id) => {
        dispatch(activateVideoAd(id))
            .unwrap()
            .catch((error) => {
                console.error('Ошибка при активации видеорекламы:', error);
            });
    };

    const calculateTimeRemaining = (expirationDate) => {
        const expiration = new Date(expirationDate);
        const now = new Date();
        const difference = expiration - now;

        if (difference <= 0) return 'Срок истек';

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );

        return `${days} дн. ${hours} ч.`;
    };

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Видео Реклама</h1>
                <button className={styles.create} onClick={onAddVideoAd}>
                    + Добавить видеорекламу
                </button>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Статус</th>
                        <th>Срок истечения</th>
                        <th>Изменить</th>
                        <th>Удалить</th>
                        <th>Приостановить</th>
                    </tr>
                </thead>
                <tbody>
                    {videoAds.map((ad) => (
                        <tr key={ad.id}>
                            <td>{ad.id}</td>
                            <td>{ad.title}</td>
                            <td>
                                {ad.status === 'active'
                                    ? 'активный'
                                    : 'остановлен'}
                            </td>
                            <td>
                                {ad.expirationDate
                                    ? `${ad.expirationDate.substring(0, 10)} (${calculateTimeRemaining(ad.expirationDate)})`
                                    : 'Нет даты истечения'}
                            </td>
                            <td>
                                <button
                                    onClick={() => onEditVideoAd(ad)}
                                    className={styles.editButton}
                                >
                                    Изменить
                                </button>
                            </td>
                            <td>
                                <button
                                    onClick={() => openDeleteModal(ad.id)}
                                    className={styles.deleteButton}
                                >
                                    Удалить
                                </button>
                            </td>
                            <td>
                                {ad.status === 'active' ? (
                                    <button
                                        className={styles.pauseButton}
                                        onClick={() => handlePause(ad.id)}
                                    >
                                        Приостановить
                                    </button>
                                ) : (
                                    <button
                                        className={styles.activeButton}
                                        onClick={() => handleActivate(ad.id)}
                                    >
                                        Активировать
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                description="Вы уверены, что хотите удалить это видео?"
            />
        </div>
    );
};
