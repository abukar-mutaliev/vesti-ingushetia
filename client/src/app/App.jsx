import { Suspense } from 'react';
import { AppRouter } from './providers/router';
import { Header } from '@widgets/Header/index.js';
import styles from './App.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';
import { Footer } from '@shared/ui/Footer/ui/Footer.jsx';
import TooManyRequests from '@shared/ui/TooManyRequests/ui/TooManyRequests.jsx';
import { HelmetProvider } from 'react-helmet-async';

function App() {
    return (
        <div className={styles.appBody}>
            <Suspense
                fallback={
                    <div className={styles.loaderContainer}>
                        <Loader />
                    </div>
                }
            >
                <HelmetProvider>
                    <TooManyRequests />
                    <Header />
                    <AppRouter />
                </HelmetProvider>
            </Suspense>
            <Footer />
        </div>
    );
}

export default App;
