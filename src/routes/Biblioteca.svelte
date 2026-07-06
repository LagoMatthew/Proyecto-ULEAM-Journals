<script>
  import { onMount } from 'svelte';
  import { listarArticulosPublicados } from '../lib/db.js';
  import { formatearFecha } from '../lib/utils.js';
  import { sesion, ruta } from '../lib/stores.js';
  import PdfViewer from '../lib/components/PdfViewer.svelte';

  let articulos = [];
  let cargando = true;
  let error = '';
  let busqueda = '';
  let articuloSeleccionado = null;

  $: filtrados = articulos.filter((a) => {
    const texto = (a.titulo + ' ' + (a.palabras_clave || '')).toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  async function cargar() {
    cargando = true;
    error = '';
    try {
      articulos = await listarArticulosPublicados();
    } catch (e) {
      error = e.message;
    } finally {
      cargando = false;
    }
  }

  onMount(cargar);
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
  <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-brand-crimson text-white w-10 h-10 rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined">menu_book</span>
        </div>
        <div>
          <strong class="text-gray-900 dark:text-white">ULEAM Journals</strong>
          <p class="text-xs text-gray-500 dark:text-gray-400">Biblioteca Digital Pública</p>
        </div>
      </div>
      {#if $sesion}
        <button class="btn btn-outline" on:click={() => ruta.ir('/' + $sesion.rol.toLowerCase())}>
          <span class="material-symbols-outlined text-base">arrow_back</span> Volver a mi panel
        </button>
      {:else}
        <button class="btn btn-primary" on:click={() => ruta.ir('/login')}>
          <span class="material-symbols-outlined text-base">login</span> Iniciar Sesión
        </button>
      {/if}
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-6 py-10">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Artículos Publicados</h1>
      <p class="text-gray-500 dark:text-gray-400 text-sm">Repositorio abierto de artículos científicos validados por pares</p>
    </div>

    <div class="relative max-w-md mb-8">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
      <input class="form-control pl-10" placeholder="Buscar por título o palabra clave..." bind:value={busqueda} />
    </div>

    {#if cargando}
      <p class="text-gray-400 text-sm">Cargando artículos...</p>
    {:else if error}
      <p class="text-red-600 text-sm">{error}</p>
    {:else if filtrados.length === 0}
      <div class="card p-16 text-center text-gray-400">
        <span class="material-symbols-outlined text-5xl mb-3">auto_stories</span>
        <p>Todavía no hay artículos que coincidan con la búsqueda.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filtrados as art}
          <div class="card p-6 flex flex-col">
            <span class="material-symbols-outlined text-brand-teal text-3xl mb-3">description</span>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{art.titulo}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-3">{art.abstract}</p>
            <div class="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{art.usuarios?.nombre_completo || 'Autor desconocido'}</span>
              <span>{formatearFecha(art.fecha_envio)}</span>
            </div>
            <button class="btn btn-outline w-full justify-center mt-4" on:click={() => (articuloSeleccionado = art)}>
              <span class="material-symbols-outlined text-base">visibility</span> Leer artículo
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </main>

  {#if articuloSeleccionado}
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" on:click|self={() => (articuloSeleccionado = null)}>
      <div class="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div class="flex items-start justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white pr-4">{articuloSeleccionado.titulo}</h2>
          <button class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" on:click={() => (articuloSeleccionado = null)}>
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <PdfViewer url={articuloSeleccionado.archivo_pdf_url} alto="70vh" />
      </div>
    </div>
  {/if}
</div>
