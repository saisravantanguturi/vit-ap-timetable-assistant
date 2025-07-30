import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        define: {
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            rollupOptions: {
                input: path.resolve(__dirname, 'src', 'index.tsx'),
                output: {
                    entryFileNames: 'index.js',
                    // IMPORTANT: Flatten asset output directly into dist/
                    assetFileNames: '[name].[ext]', // <--- CHANGED THIS LINE to remove 'assets/' prefix
                    chunkFileNames: 'chunks/[name]-[hash].js', // Put JS chunks in a 'chunks' subfolder
                },
            },
            // IMPORTANT: This tells Vite to output all assets (including CSS) directly into the 'outDir' (dist).
            // It overrides the default behavior of putting them in 'dist/assets'.
            assetsDir: '' // <--- ADD THIS LINE
        },
    };
});