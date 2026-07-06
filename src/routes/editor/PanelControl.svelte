<script>
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '../../lib/supabaseClient.js';

  const dispatch = createEventDispatcher();

  let nuevas = 0;
  let revision = 0;
  let pendientes = 0;
  let publicados = 0;
  let cargando = true;
  let canal;

  async function cargarContadores() {
    try {
      const { data, error } = await supabase.from('articulos').select('estado');
      if (error) throw error;

      let n = 0, r = 0, p = 0, pub = 0;
      (data || []).forEach((art) => {
        const e = (art.estado || '').trim();
        if (e === 'Nueva Presentacion') n++;
        else if (e === 'En Revision') r++;
        else if (e === 'Decision Pendiente') p++;
        else if (e === 'Publicado') pub++;
      });
      nuevas = n;
      revision = r;
      pendientes = p;
      publicados = pub;
    } catch (e) {
      console.error('Error al cargar KPIs:', e.message);
    } finally {
      cargando = false;
    }
  }

  onMount(() => {
    cargarContadores();
    canal = supabase
      .channel('canal-articulos-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articulos' }, cargarContadores)
      .subscribe();
  });

  onDestroy(() => {
    if (canal) supabase.removeChannel(canal);
  });

  const kpis = [
    { key: 'nuevas', icon: 'send', label: 'Nuevas Presentaciones', clickable: true },
    { key: 'revision', icon: 'schedule', label: 'En Revisión', clickable: true },
    { key: 'pendientes', icon: 'assignment', label: 'Decisiones Pendientes', clickable: true },
    { key: 'publicados', icon: 'check_circle', label: 'Publicados', clickable: false },
  ];

  $: valores = { nuevas, revision, pendientes, publicados };
</script>

<div class="mb-6">
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
  <p class="text-gray-500 dark:text-gray-400 text-sm">Bienvenido al Sistema de Gestión de Revistas Científicas</p>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
  {#each kpis as k}
    <button
      class="card p-5 text-left transition-transform"
      class:hover:-translate-y-1={k.clickable}
      class:hover:shadow-md={k.clickable}
      class:cursor-pointer={k.clickable}
      class:cursor-default={!k.clickable}
      on:click={() => k.clickable && dispatch('navegar', 'revision-pares')}
    >
      <div class="flex items-center justify-between mb-4">
        <span class="material-symbols-outlined text-brand-teal bg-brand-tealSoft dark:bg-brand-teal/20 p-2 rounded-lg">{k.icon}</span>
      </div>
      <h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">{cargando ? '—' : valores[k.key]}</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">{k.label}</p>
    </button>
  {/each}
</div>
