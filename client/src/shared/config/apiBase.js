const fromEnv = import.meta.env.VITE_API_URL;

const isUsableBase = (value) =>
    typeof value === 'string' && value.length > 0 && value !== 'undefined';

const fallbackBase = () => {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}/api`;
    }
    return '/api';
};

export const API_BASE_URL = (isUsableBase(fromEnv) ? fromEnv : fallbackBase()).replace(
    /\/$/,
    '',
);
