<script>
  import Sidebar from '../../lib/components/Sidebar.svelte';
  import Topbar from '../../lib/components/Topbar.svelte';
  import BandejaRevisiones from './BandejaRevisiones.svelte';
  import { tema } from '../../lib/stores.js';

  let vista = 'bandeja';

  const items = [
    { key: 'bandeja', label: 'Bandeja de Revisiones', icon: 'rate_review' },
    { key: 'configuracion', label: 'Configuración', icon: 'settings' },
  ];

  function cambiar(e) {
    vista = e.detail;
  }
</script>

<div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
  <Sidebar {items} activo={vista} versionTag="Módulo Revisor" on:cambiar={cambiar} />

  <main class="flex-1 flex flex-col overflow-y-auto">
    <Topbar titulo={vista === 'bandeja' ? 'Bandeja de Revisiones' : 'Configuración'} />

    <div class="flex-1 p-8 max-w-5xl w-full mx-auto">
      {#if vista === 'bandeja'}
        <BandejaRevisiones />
      {:else}
        <div class="card p-8">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Apariencia</h3>
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-800 dark:text-gray-200">Modo Oscuro</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Cambia la apariencia de toda la aplicación</p>
            </div>
            <button
              class="w-14 h-8 rounded-full flex items-center px-1 transition-colors"
              class:bg-brand-teal={$tema === 'dark'}
              class:bg-gray-300={$tema !== 'dark'}
              on:click={() => tema.alternar()}
            >
              <span class="w-6 h-6 bg-white rounded-full shadow transition-transform" class:translate-x-6={$tema === 'dark'}></span>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </main>
</div>
