// =============================================================
// MAIN.JS — Punto de entrada de la aplicación
// -------------------------------------------------------------
// Este es el primer archivo JavaScript que se ejecuta. Su único
// trabajo es tomar el componente raíz (App.svelte) y "montarlo"
// dentro del <div id="app"></div> que está en index.html. A partir
// de aquí, Svelte se encarga de dibujar y actualizar todo el DOM.
// =============================================================
import './app.css';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app'),
});

export default app;
