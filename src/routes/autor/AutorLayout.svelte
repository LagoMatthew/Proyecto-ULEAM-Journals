<script>
  import Sidebar from '../../lib/components/Sidebar.svelte';
  import Topbar from '../../lib/components/Topbar.svelte';
  import NuevaPresentacion from './NuevaPresentacion.svelte';
  import MisArticulos from './MisArticulos.svelte';
  import { ruta } from '../../lib/stores.js';

  let vista = 'nueva';

  const items = [
    { key: 'nueva', label: 'Nueva Presentación', icon: 'send' },
    { key: 'mis-articulos', label: 'Mis Artículos', icon: 'folder_open' },
    { key: 'biblioteca', label: 'Biblioteca Digital', icon: 'auto_stories' },
  ];

  function cambiar(e) {
    if (e.detail === 'biblioteca') {
      ruta.ir('/biblioteca');
      return;
    }
    vista = e.detail;
  }

  const titulos = {
    nueva: 'Nueva Presentación: Artículo Científico',
    'mis-articulos': 'Mis Artículos',
  };
</script>

<div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
  <Sidebar {items} activo={vista} versionTag="Módulo Autor" on:cambiar={cambiar} />

  <main class="flex-1 flex flex-col overflow-y-auto">
    <Topbar titulo={titulos[vista] || 'Portal del Investigador'} />

    <div class="flex-1 p-8 max-w-5xl w-full mx-auto">
      {#if vista === 'nueva'}
        <NuevaPresentacion on:enviado={() => (vista = 'mis-articulos')} />
      {:else if vista === 'mis-articulos'}
        <MisArticulos />
      {/if}
    </div>
  </main>
</div>
