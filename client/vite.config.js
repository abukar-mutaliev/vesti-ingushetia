import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
    plugins: [react()],
    server: {
        https: {
            key: fs.readFileSync(
                path.resolve(__dirname, './server/cf/private-key.pem'),
            ),
            cert: fs.readFileSync(
                path.resolve(__dirname, './server/cf/certificate.pem'),
            ),
            ca: fs.readFileSync(
                path.resolve(__dirname, './server/cf/csr.pem'),
            ),
        },
        host: 'localhost',
        port: 5173,
    },
    define: {
        global: {},
    },
    resolve: {
        alias: {
            '@app': path.resolve(__dirname, './src/app'),
            '@assets': path.resolve(__dirname, './src/assets'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@widgets': path.resolve(__dirname, './src/widgets'),
            '@features': path.resolve(__dirname, './src/features'),
            '@entities': path.resolve(__dirname, './src/entities'),
            '@shared': path.resolve(__dirname, './src/shared'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                additionalData: `@use '@shared/styles/variables' as *;`,
            },
        },
    },
});
