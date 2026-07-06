<script>
  import { createEventDispatcher } from 'svelte';
  import { sesion } from '../stores.js';

  export let items = []; // [{ key, label, icon }]
  export let activo = '';
  export let versionTag = '';

  const dispatch = createEventDispatcher();
  let colapsado = false;

  function seleccionar(key) {
    dispatch('cambiar', key);
  }

  function cerrarSesion() {
    if (confirm('¿Desea cerrar sesión?')) {
      sesion.cerrar();
      window.location.hash = '/login';
    }
  }
</script>

<aside
  class="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col py-5 relative transition-all duration-300 shrink-0 h-screen sticky top-0"
  class:w-64={!colapsado}
  class:w-20={colapsado}
>
  <button
    class="flex items-center gap-2.5 px-5 pb-7 cursor-pointer hover:scale-[1.02] transition-transform"
    class:justify-center={colapsado}
    class:px-0={colapsado}
    on:click={() => (colapsado = !colapsado)}
    title="Colapsar / Expandir menú"
  >
    <div class="bg-brand-crimson text-white w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
      <span class="material-symbols-outlined">menu_book</span>
    </div>
    {#if !colapsado}
      <div class="text-left leading-tight whitespace-nowrap">
        <strong class="text-gray-900 dark:text-white">ULEAM</strong><br />
        <span class="text-xs text-gray-500 dark:text-gray-400">Journals</span>
      </div>
    {/if}
  </button>

  <nav class="flex flex-col gap-1 px-2.5">
    {#each items as item}
      <button
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        class:justify-center={colapsado}
        class:bg-brand-teal={activo === item.key}
        class:text-white={activo === item.key}
        class:text-gray-500={activo !== item.key}
        class:dark:text-gray-400={activo !== item.key}
        class:hover:bg-gray-100={activo !== item.key}
        class:dark:hover:bg-gray-800={activo !== item.key}
        on:click={() => seleccionar(item.key)}
      >
        <span class="material-symbols-outlined">{item.icon}</span>
        {#if !colapsado}<span>{item.label}</span>{/if}
      </button>
    {/each}
  </nav>

  <div class="mt-auto px-2.5 pt-4">
    <button
      class="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 text-brand-crimsonBright transition-colors"
      class:justify-center={colapsado}
      on:click={cerrarSesion}
    >
      <span class="material-symbols-outlined">logout</span>
      {#if !colapsado}<span>Cerrar Sesión</span>{/if}
    </button>
    {#if !colapsado && versionTag}
      <div class="mt-3 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full py-1.5 px-3">
        {versionTag}
      </div>
    {/if}
  </div>
</aside>
