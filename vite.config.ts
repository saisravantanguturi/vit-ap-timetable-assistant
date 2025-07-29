import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: { // ADD THIS ENTIRE BUILD OBJECT
        lib: {
          entry: path.resolve(__dirname, 'public', 'index.html'), // Explicitly point to index.html within public
          name: 'App', // A name for your app, can be anything
          formats: ['es'] // Output format as ES module
        },
        rollupOptions: {
          // No specific output options needed unless you have custom requirements
        },
        emptyOutDir: true // Clear the dist folder before building
      }
    };
});