<script>
  import { onMount, onDestroy } from 'svelte';
  import { sesion } from '../../lib/stores.js';
  import { listarArticulosPorAutor } from '../../lib/db.js';
  import { supabase } from '../../lib/supabaseClient.js';
  import { colorEstadoArticulo, colorRecomendacion, formatearFecha } from '../../lib/utils.js';
  import Tag from '../../lib/components/Tag.svelte';
  import PdfViewer from '../../lib/components/PdfViewer.svelte';

  let articulos = [];
  let cargando = true;
  let error = '';
  let seleccionado = null;
  let canal;

  function revisionDe(articulo) {
    return articulo.revisiones && articulo.revisiones.length > 0 ? articulo.revisiones[0] : null;
  }

  async function cargar() {
    try {
      articulos = await listarArticulosPorAutor($sesion.id);
    } catch (e) {
      error = e.message;
    } finally {
      cargando = false;
    }
  }

  onMount(() => {
    cargar();
    canal = supabase
      .channel('canal-articulos-autor-' + $sesion.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articulos', filter: `autor_principal_id=eq.${$sesion.id}` },
        cargar
      )
      .subscribe();
  });

  onDestroy(() => {
    if (canal) supabase.removeChannel(canal);
  });
</script>

<div class="mb-6">
  <p class="text-gray-500 dark:text-gray-400 text-sm">Seguimiento en tiempo real del estado de sus manuscritos</p>
</div>

{#if cargando}
  <p class="text-gray-400 text-sm">Cargando artículos...</p>
{:else if error}
  <p class="text-red-600 text-sm">{error}</p>
{:else if articulos.length === 0}
  <div class="card p-16 text-center text-gray-400">
    <span class="material-symbols-outlined text-5xl mb-3">folder_off</span>
    <p>Todavía no ha enviado ningún manuscrito.</p>
  </div>
{:else}
  <div class="space-y-4">
    {#each articulos as art}
      <div class="card p-6">
        <div class="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">{art.titulo}</h3>
            <p class="text-xs text-gray-400 mt-1">Enviado el {formatearFecha(art.fecha_envio)}</p>
          </div>
          <Tag texto={art.estado} tipo={colorEstadoArticulo(art.estado)} />
        </div>

        {#if revisionDe(art)}
          {@const rev = revisionDe(art)}
          <div class="mt-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Comentario del revisor:</span>
              {#if rev.recomendacion}<Tag texto={rev.recomendacion} tipo={colorRecomendacion(rev.recomendacion)} />{/if}
            </div>
            {#if rev.comentarios_autor}
              <p class="text-sm text-gray-700 dark:text-gray-300">{rev.comentarios_autor}</p>
            {:else}
              <p class="text-sm text-gray-400">Revisión en curso, todavía sin comentarios.</p>
            {/if}
          </div>
        {/if}

        <button class="btn btn-outline btn-sm mt-4" on:click={() => (seleccionado = art)}>
          <span class="material-symbols-outlined text-base">visibility</span> Ver PDF
        </button>
      </div>
    {/each}
  </div>
{/if}

{#if seleccionado}
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" on:click|self={() => (seleccionado = null)}>
    <div class="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
      <div class="flex items-start justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white pr-4">{seleccionado.titulo}</h2>
        <button class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" on:click={() => (seleccionado = null)}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <PdfViewer url={seleccionado.archivo_pdf_url} alto="70vh" />
    </div>
  </div>
{/if}
