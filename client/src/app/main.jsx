import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { Provider } from 'react-redux';
import store, { persistor } from './providers/store/store.js';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import { Loader } from '@shared/ui/Loader/index.js';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <BrowserRouter>
                    <PersistGate loading={<Loader />} persistor={persistor}>
                        <App />
                    </PersistGate>
                </BrowserRouter>
            </PersistGate>
        </Provider>
    </StrictMode>,
);
