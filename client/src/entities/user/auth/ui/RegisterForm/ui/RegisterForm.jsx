import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    selectAuthError,
    selectAuthSuccess,
    selectLoading,
} from '@entities/user/auth/model/authSelectors.js';
import {
    clearError,
    clearSuccess,
    registerUser,
} from '@entities/user/auth/model/authSlice.js';
import styles from './RegisterForm.module.scss';
import { useNavigate } from 'react-router-dom';
import { SuccessMessage } from '@entities/user/auth/ui/SuccessMessage/index.js';

export const RegisterForm = () => {
    const dispatch = useDispatch();
    const loading = useSelector(selectLoading);
    const error = useSelector(selectAuthError);
    const success = useSelector(selectAuthSuccess);
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
        },
        validationSchema: Yup.object({
            username: Yup.string().required('Обязательное поле'),
            email: Yup.string()
                .email('Неверный email')
                .required('Обязательное поле'),
            password: Yup.string()
                .min(6, 'Минимум 6 символов')
                .required('Обязательное поле'),
        }),
        onSubmit: (values) => {
            dispatch(registerUser(values));
        },
    });

    useEffect(() => {
        if (success) {
            dispatch(clearSuccess());
        }
    }, [success, dispatch]);

    const handleNavigateToLogin = () => {
        navigate('/login');
    };

    return (
        <div className={styles.container}>
            {success ? (
                <SuccessMessage />
            ) : (
                <form onSubmit={formik.handleSubmit} className={styles.form}>
                    <h2 className={styles.title}>Регистрация</h2>
                    <div className={styles.formGroup}>
                        <label htmlFor="username" className={styles.label}>
                            Имя пользователя
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            className={styles.input}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.username}
                        />
                        {formik.touched.username && formik.errors.username ? (
                            <div className={styles.error}>
                                {formik.errors.username}
                            </div>
                        ) : null}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className={styles.input}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.email}
                        />
                        {formik.touched.email && formik.errors.email ? (
                            <div className={styles.error}>
                                {formik.errors.email}
                            </div>
                        ) : null}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Пароль
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className={styles.input}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.password}
                        />
                        {formik.touched.password && formik.errors.password ? (
                            <div className={styles.error}>
                                {formik.errors.password}
                            </div>
                        ) : null}
                    </div>
                    {error && (
                        <div className={styles.serverError}>
                            <p>{error}</p>
                            <button
                                type="button"
                                className={styles.closeButton}
                                onClick={() => dispatch(clearError())}
                            >
                                Закрыть
                            </button>
                        </div>
                    )}
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Загрузка...' : 'Зарегистрироваться'}
                    </button>
                </form>
            )}
        </div>
    );
};
