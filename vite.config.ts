import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: '[name]',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        preserveModules: true,
      },
    },
    minify: false,
  },
  plugins: [
    vue(),
    dts({
      exclude: ['vite.config.ts', '**/__tests__/**'],
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
