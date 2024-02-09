import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/vue-storer.ts'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue'],
    },
  },
  plugins: [
    vue(),
    dts({
      exclude: ['src/**/*.spec.ts'],
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
