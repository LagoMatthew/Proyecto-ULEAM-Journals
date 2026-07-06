<script>
  import { onMount, onDestroy } from 'svelte';
  import { obtenerNotificaciones } from '../db.js';
  import { supabase } from '../supabaseClient.js';

  let abierto = false;
  let total = 0;
  let items = [];
  let canal;

  async function cargar() {
    try {
      const res = await obtenerNotificaciones();
      total = res.total;
      items = res.items;
    } catch (e) {
      console.error('Error al cargar notificaciones:', e);
    }
  }

  function alternar() {
    abierto = !abierto;
    if (abierto) cargar();
  }

  const iconoPorTipo = {
    nueva: 'send',
    validar: 'task_alt',
    registro: 'person_add',
  };

  onMount(() => {
    cargar();
    canal = supabase
      .channel('canal-notificaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articulos' }, cargar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, cargar)
      .subscribe();
  });

  onDestroy(() => {
    if (canal) supabase.removeChannel(canal);
  });
</script>

<div class="relative">
  <button
    class="relative text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer"
    on:click={alternar}
  >
    <span class="material-symbols-outlined">notifications</span>
    {#if total > 0}
      <span
        class="absolute -top-1 -right-1 bg-brand-crimson text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
      >
        {total}
      </span>
    {/if}
  </button>

  {#if abierto}
    <div
      class="absolute right-0 mt-3 w-80 card z-50 max-h-96 overflow-y-auto"
      role="menu"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-800 dark:text-gray-100">
        Notificaciones
      </div>
      {#if items.length === 0}
        <p class="px-4 py-6 text-center text-sm text-gray-400">No hay novedades por ahora.</p>
      {:else}
        {#each items as n}
          <div class="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-sm">
            <span class="material-symbols-outlined text-brand-teal text-lg">{iconoPorTipo[n.tipo] || 'info'}</span>
            <span class="text-gray-700 dark:text-gray-200">{n.texto}</span>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
