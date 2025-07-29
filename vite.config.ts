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
      build: { // Keep this build object
        outDir: 'dist', // Output to the 'dist' folder at the project root
        emptyOutDir: true, // Clear the dist folder before building
        rollupOptions: {
          input: {
            // IMPORTANT: This tells Vite that your application's entry point is index.tsx
            main: path.resolve(__dirname, 'src', 'index.tsx')
          },
          output: {
            // This will output the main JS bundle directly as 'index.js' in the dist folder
            entryFileNames: `[name].js`,
            chunkFileNames: `[name].js`,
            assetFileNames: `[name].[ext]`
          }
        }
      }
    };
});