import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import {
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import { setStore } from './apiClient'

const persistConfig = {
    key: 'root',
    storage,
    whitelist: [
        'auth',
        'categories',
        'newsList',
        'videoAd',
        'radio',
        'projects'
    ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
            },
            immutableCheck: import.meta.env.NODE_ENV !== 'production',
        }),
});

setStore(store);
export const persistor = persistStore(store);

export default store;
