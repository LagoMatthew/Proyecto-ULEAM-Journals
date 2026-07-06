// =============================================================
// VITE.CONFIG.JS
// -------------------------------------------------------------
// Svelte por sí solo es solo un compilador: convierte archivos
// .svelte en JavaScript normal. Pero para poder ejecutar el
// proyecto en el navegador (con "npm run dev") y para empaquetarlo
// al final (con "npm run build") se necesita una herramienta que
// arme todos los archivos, los optimice y levante un servidor de
// desarrollo. Esa herramienta es Vite.
//
// Este archivo es la configuración de Vite: le dice "usa el
// plugin de Svelte para poder entender archivos .svelte" y "abre
// el servidor de desarrollo en el puerto 5173". No contiene lógica
// de la aplicación, solo configuración de la herramienta de build.
// =============================================================
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
  },
});
