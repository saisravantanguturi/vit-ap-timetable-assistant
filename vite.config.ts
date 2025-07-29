import { defineConfig, loadEnv } from 'vite';
import path from 'path'; // Needed for path.resolve

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), ''); // process.cwd() is standard here
    return {
        define: {
            // Correctly define environment variables for access in your app
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                // This alias lets you use @/ to refer to your src folder (e.g., import App from '@/App')
                '@': path.resolve(__dirname, './src'),
            },
        },
        build: {
            outDir: 'dist',         // Output built files to a 'dist' folder at the root of your project
            emptyOutDir: true,      // Clear the 'dist' folder before building
            rollupOptions: {
                // This specifies the main entry point for your JavaScript/TypeScript application
                input: path.resolve(__dirname, 'src', 'index.tsx'),
                output: {
                    // This tells Vite/Rollup to name your main JavaScript bundle 'index.js'
                    entryFileNames: 'index.js',
                    // These lines ensure other generated files (like CSS, image assets, and other JS chunks)
                    // go into an 'assets' subfolder within 'dist' with unique hashes.
                    chunkFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash].[ext]',
                },
            },
        },
        // The 'publicDir' option (by default 'public') automatically copies 'public/index.html'
        // to the 'outDir' ('dist') and injects the bundled scripts.
        // You don't need to manually specify it unless your public folder is named something else.
    };
});