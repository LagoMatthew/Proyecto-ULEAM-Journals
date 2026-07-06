<script>
/// Este archivo es el punto de entrada de la aplicación y maneja la navegación y renderizado de vistas según el estado de sesión y la ruta actual.

  import { sesion, ruta } from './lib/stores.js';
  import Login from './routes/Login.svelte';
  import Biblioteca from './routes/Biblioteca.svelte';
  import AutorLayout from './routes/autor/AutorLayout.svelte';
  import EditorLayout from './routes/editor/EditorLayout.svelte';
  import RevisorLayout from './routes/revisor/RevisorLayout.svelte';

  $: rutaActual = $ruta;
  $: usuario = $sesion;

  // Guardas de navegación: se re-evalúan reactivamente ante cualquier cambio
  $: {
    const esPublica = rutaActual.startsWith('/biblioteca');
    if (!usuario && !esPublica && !rutaActual.startsWith('/login')) {
      ruta.ir('/login');
    } else if (usuario) {
      const home = '/' + usuario.rol.toLowerCase();
      const base = '/' + rutaActual.split('/')[1];
      const esSeccionDeRol = ['/autor', '/editor', '/revisor'].includes(base);
      if (rutaActual.startsWith('/login')) {
        ruta.ir(home);
      } else if (esSeccionDeRol && base !== home) {
        ruta.ir(home);
      }
    }
  }
</script>

{#if rutaActual.startsWith('/biblioteca')}
  <Biblioteca />
{:else if !usuario || rutaActual.startsWith('/login')}
  <Login />
{:else if usuario.rol === 'Autor'}
  <AutorLayout />
{:else if usuario.rol === 'Editor'}
  <EditorLayout />
{:else if usuario.rol === 'Revisor'}
  <RevisorLayout />
{:else}
  <div class="min-h-screen flex items-center justify-center text-gray-500">
    Rol no reconocido. Contacte al administrador.
  </div>
{/if}
