import React, { Suspense, useEffect } from 'react';
import { AppRouter } from './providers/router';
import { Header } from '@widgets/Header/index.js';
import styles from './App.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';
import { Footer } from '@shared/ui/Footer/ui/Footer.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { restoreAuth } from '@entities/user/auth/model/authSlice.js';

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(restoreAuth());
    }, [dispatch]);

    return (
        <div className={styles.appBody}>
            <Suspense
                fallback={
                    <div className={styles.loaderContainer}>
                        <Loader />
                    </div>
                }
            >
                <Header />
                <AppRouter />
                <Footer />
            </Suspense>
        </div>
    );
}

export default App;
