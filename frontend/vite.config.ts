import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  resolve: { //Vite necesita su propia configuración de alias, ya que no lee automáticamente las rutas de TypeScript. 
    alias: { //Debes usar rutas absolutas aquí con el módulo path de Node.js. 
      '@': resolve(__dirname, './src'), // O el alias y ruta que prefieras
      // '@components': resolve(__dirname, './src/components'),
    },
  },
})