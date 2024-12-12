import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    selectAuthError,
    selectLoading,
} from '@entities/user/auth/model/authSelectors.js';
import { clearError, loginUser } from '@entities/user/auth/model/authSlice.js';
import styles from './LoginForm.module.scss';
import { Link, useNavigate } from 'react-router-dom';

export const LoginForm = () => {
    const dispatch = useDispatch();
    const loading = useSelector(selectLoading);
    const error = useSelector(selectAuthError);
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: Yup.object({
            email: Yup.string()
                .email('Неверный email')
                .required('Обязательное поле'),
            password: Yup.string().required('Обязательное поле'),
        }),
        onSubmit: async (values) => {
            const resultAction = await dispatch(loginUser(values));

            if (loginUser.fulfilled.match(resultAction)) {
                const isAdmin = resultAction.payload.isAdmin;

                if (isAdmin) {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/');
                }
            } else if (loginUser.rejected.match(resultAction)) {
                console.error(
                    'Ошибка авторизации:',
                    resultAction.payload || resultAction.error.message,
                );
            }
        },
    });

    return (
        <div className={styles.container}>
            <form onSubmit={formik.handleSubmit} className={styles.form}>
                <h2 className={styles.title}>Вход в систему</h2>
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
                    {loading ? 'Загрузка...' : 'Войти'}
                </button>
                <div className={styles.registerButton}>
                    Нету профиля?{' '}
                    <Link to={'/register'}>Зарегистрироваться</Link>
                </div>
            </form>
        </div>
    );
};
