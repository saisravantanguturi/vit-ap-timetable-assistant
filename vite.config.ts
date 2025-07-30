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
                    // IMPORTANT: Change assetFileNames to put all assets directly in dist/
                    assetFileNames: '[name].[ext]', // <--- CHANGED THIS LINE
                    // Vite will auto-hash assets if it needs to, but this simplifies pathing.
                    // If it still hashes, we'll need to re-verify the exact name in `dist`
                    // or switch to a hash-agnostic approach if necessary.
                    // Let's try this simple output first.
                    chunkFileNames: '[name]-[hash].js', // Keep chunks with hash
                },
            },
        },
    };
});