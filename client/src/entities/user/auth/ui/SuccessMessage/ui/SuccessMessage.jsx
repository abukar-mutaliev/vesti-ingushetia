import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearSuccess } from '@entities/user/auth/model/authSlice';
import { selectAuthSuccess } from '@entities/user/auth/model/authSelectors';
import { useNavigate } from 'react-router-dom';
import styles from './SuccessMessage.module.scss';

export const SuccessMessage = () => {
    const dispatch = useDispatch();
    const success = useSelector(selectAuthSuccess);
    const navigate = useNavigate();

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                dispatch(clearSuccess());
                navigate('/login');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [success, dispatch, navigate]);

    if (!success) return null;

    return (
        <div className={styles.successMessage}>
            <h2 className={styles.title}>Регистрация прошла успешно!</h2>
            <p className={styles.text}>
                Теперь вы можете войти в свою учетную запись.
            </p>
        </div>
    );
};
