import { useDispatch, useSelector } from 'react-redux';
import { clearError } from '@app/providers/store/errorSlice';

const TooManyRequests = () => {
    const errorMessage = useSelector((state) => state.error.message);

    const dispatch = useDispatch();

    if (!errorMessage) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.container}>
                <p>
                    Вы сделали слишком много запросов за короткий промежуток
                    времени. Пожалуйста, подождите несколько минут и попробуйте
                    снова через {errorMessage}.
                </p>
                <button
                    onClick={() => dispatch(clearError())}
                    style={styles.button}
                >
                    Закрыть
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    container: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '80%',
    },
    button: {
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#007BFF',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

export default TooManyRequests;
