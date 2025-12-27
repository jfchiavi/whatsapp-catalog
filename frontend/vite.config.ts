import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'), // O el alias y ruta que prefieras
      // '@components': resolve(__dirname, './src/components'),
    },
  },
})