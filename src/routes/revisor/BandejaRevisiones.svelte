<script>
  // Bandeja del Revisor. Cada fila viene de la tabla "revisiones"
  // (la asignación real en la base de datos), con el artículo anidado.
  import { onMount, onDestroy } from 'svelte';
  import { sesion } from '../../lib/stores.js';
  import { listarArticulosAsignados, emitirRevision } from '../../lib/db.js';
  import { supabase } from '../../lib/supabaseClient.js';
  import { colorEstadoArticulo, colorRecomendacion, formatearFecha, RECOMENDACIONES } from '../../lib/utils.js';
  import { validarRango, validarCampoTexto, validarCheckbox } from '../../lib/validaciones.js';
  import Tag from '../../lib/components/Tag.svelte';
  import PdfViewer from '../../lib/components/PdfViewer.svelte';

  let revisiones = [];
  let cargando = true;
  let error = '';
  let canal;

  let revisionActiva = null; // fila de "revisiones" que se está completando
  let notaMetodologia = '';
  let notaAporte = '';
  let notaRedaccion = '';
  let comentariosAutor = '';
  let comentariosEditor = '';
  let recomendacion = '';
  let confirmoRevision = false;
  let enviandoRevision = false;

  async function cargar() {
    try {
      revisiones = await listarArticulosAsignados($sesion.id);
    } catch (e) {
      error = e.message;
    } finally {
      cargando = false;
    }
  }

  function abrirFormulario(rev) {
    revisionActiva = rev;
    notaMetodologia = '';
    notaAporte = '';
    notaRedaccion = '';
    comentariosAutor = '';
    comentariosEditor = '';
    recomendacion = '';
    confirmoRevision = false;
  }

  // Validación campo por campo con alert(), igual que en el resto del proyecto
  function validarRevision() {
    if (!validarRango(notaMetodologia, 1, 5, 'La nota de metodología')) return false;
    if (!validarRango(notaAporte, 1, 5, 'La nota de aporte')) return false;
    if (!validarRango(notaRedaccion, 1, 5, 'La nota de redacción')) return false;
    if (!validarCampoTexto(comentariosAutor, 'El comentario para el autor')) return false;
    if (!recomendacion) {
      alert('Debe seleccionar una recomendación');
      return false;
    }
    if (!validarCheckbox(confirmoRevision, 'Debe confirmar que revisó el manuscrito completo')) return false;
    return true;
  }

  async function enviarRevision() {
    if (!validarRevision()) return;
    enviandoRevision = true;
    try {
      await emitirRevision(revisionActiva.id, revisionActiva.articulos.id, {
        notaMetodologia: Number(notaMetodologia),
        notaAporte: Number(notaAporte),
        notaRedaccion: Number(notaRedaccion),
        comentariosAutor,
        comentariosEditor,
        recomendacion,
      });
      revisionActiva = null;
      await cargar();
    } catch (e) {
      error = e.message;
    } finally {
      enviandoRevision = false;
    }
  }

  onMount(() => {
    cargar();
    canal = supabase
      .channel('canal-revisiones-revisor-' + $sesion.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revisiones', filter: `revisor_id=eq.${$sesion.id}` }, cargar)
      .subscribe();
  });

  onDestroy(() => {
    if (canal) supabase.removeChannel(canal);
  });
</script>

<div class="mb-6">
  <p class="text-gray-500 dark:text-gray-400 text-sm">Manuscritos que el Editor en Jefe le ha asignado para revisión por pares</p>
</div>

{#if error}
  <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
    <span class="material-symbols-outlined text-base">error</span><span>{error}</span>
  </div>
{/if}

{#if cargando}
  <p class="text-gray-400 text-sm">Cargando bandeja...</p>
{:else if revisiones.length === 0}
  <div class="card p-16 text-center text-gray-400">
    <span class="material-symbols-outlined text-5xl mb-3">inbox</span>
    <p>Aún no tiene manuscritos asignados.</p>
  </div>
{:else}
  <div class="space-y-4">
    {#each revisiones as rev}
      <div class="card p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">{rev.articulos?.titulo}</h3>
            <p class="text-xs text-gray-400 mt-1">
              Autor: {rev.articulos?.usuarios?.nombre_completo || 'Desconocido'} · Recibido {formatearFecha(rev.articulos?.fecha_envio)}
              {#if rev.fecha_limite} · Plazo: {formatearFecha(rev.fecha_limite)}{/if}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{rev.articulos?.abstract}</p>
          </div>
          <Tag texto={rev.estado_revision} tipo={rev.estado_revision === 'Completada' ? 'green' : 'yellow'} />
        </div>

        <div class="flex items-center gap-3 mt-4">
          {#if rev.estado_revision !== 'Completada'}
            <button class="btn btn-primary btn-sm" on:click={() => abrirFormulario(rev)}>
              <span class="material-symbols-outlined text-base">rate_review</span> Completar Revisión
            </button>
          {:else}
            <span class="text-sm text-gray-400">Revisión enviada — recomendación: {rev.recomendacion}</span>
          {/if}
          <a href={rev.articulos?.archivo_pdf_url} target="_blank" rel="noopener" class="btn btn-outline btn-sm">
            <span class="material-symbols-outlined text-base">description</span> Ver PDF
          </a>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if revisionActiva}
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" on:click|self={() => (revisionActiva = null)}>
    <div class="bg-white dark:bg-gray-900 rounded-xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6">
      <div class="flex items-start justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white pr-4">{revisionActiva.articulos?.titulo}</h2>
        <button class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" on:click={() => (revisionActiva = null)}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PdfViewer url={revisionActiva.articulos?.archivo_pdf_url} alto="65vh" />

        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nota Metodología</label>
              <input class="form-control" placeholder="1-5" bind:value={notaMetodologia} />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nota Aporte</label>
              <input class="form-control" placeholder="1-5" bind:value={notaAporte} />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nota Redacción</label>
              <input class="form-control" placeholder="1-5" bind:value={notaRedaccion} />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comentario para el autor (visible para él) *</label>
            <textarea rows="3" class="form-control resize-none" placeholder="Observaciones que verá el autor..." bind:value={comentariosAutor}></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comentario confidencial para el Editor (el autor NO lo ve)</label>
            <textarea rows="3" class="form-control resize-none" placeholder="Notas privadas para el editor..." bind:value={comentariosEditor}></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recomendación *</label>
            <div class="space-y-2">
              {#each RECOMENDACIONES as r}
                <label class="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input type="radio" name="recomendacion" value={r} bind:group={recomendacion} />
                  <span class="text-sm text-gray-800 dark:text-gray-200">{r}</span>
                </label>
              {/each}
            </div>
          </div>

          <label class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" class="mt-1" bind:checked={confirmoRevision} />
            <span>Confirmo que leí el manuscrito completo antes de emitir esta revisión *</span>
          </label>

          <button class="btn btn-primary w-full justify-center py-3" disabled={enviandoRevision} on:click={enviarRevision}>
            <span class="material-symbols-outlined text-base">{enviandoRevision ? 'hourglass_empty' : 'send'}</span>
            {enviandoRevision ? 'Enviando...' : 'Enviar Revisión al Editor'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
