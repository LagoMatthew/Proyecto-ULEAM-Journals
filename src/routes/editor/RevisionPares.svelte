<script>
  // Gestión de Revisión por Pares (Editor en Jefe).
  // "revisiones" llega como arreglo (relación inversa 1-a-muchos desde
  // articulos), así que tomamos el primer/único elemento con revisionDe().
  import { onMount, onDestroy } from 'svelte';
  import { listarArticulos, listarRevisores, asignarRevisor, publicarArticulo, rechazarArticulo } from '../../lib/db.js';
  import { supabase } from '../../lib/supabaseClient.js';
  import { colorEstadoArticulo, colorRecomendacion, formatearFecha } from '../../lib/utils.js';
  import { validarRango, validarCampoTexto } from '../../lib/validaciones.js';
  import Tag from '../../lib/components/Tag.svelte';
  import PdfViewer from '../../lib/components/PdfViewer.svelte';

  let articulos = [];
  let revisores = [];
  let cargando = true;
  let error = '';
  let canal;

  function revisionDe(articulo) {
    return articulo.revisiones && articulo.revisiones.length > 0 ? articulo.revisiones[0] : null;
  }

  // Modal: asignar revisor
  let articuloParaAsignar = null;
  let revisorElegido = '';
  let asignando = false;

  // Modal: validar publicación
  let articuloParaValidar = null;
  let scoreMetodologia = '';
  let scoreAporte = '';
  let comentariosEditor = '';
  let procesando = false;

  async function cargar() {
    try {
      [articulos, revisores] = await Promise.all([listarArticulos(), listarRevisores()]);
    } catch (e) {
      error = e.message;
    } finally {
      cargando = false;
    }
  }

  function abrirAsignar(art) {
    articuloParaAsignar = art;
    revisorElegido = '';
  }

  async function confirmarAsignacion() {
    if (!revisorElegido) return;
    asignando = true;
    try {
      await asignarRevisor(articuloParaAsignar.id, revisorElegido);
      articuloParaAsignar = null;
      await cargar();
    } catch (e) {
      error = e.message;
    } finally {
      asignando = false;
    }
  }

  function abrirValidar(art) {
    articuloParaValidar = art;
    scoreMetodologia = '';
    scoreAporte = '';
    comentariosEditor = '';
  }

  function validarEvaluacionEditor() {
    if (!validarRango(scoreMetodologia, 1, 5, 'La calificación de metodología')) return false;
    if (!validarRango(scoreAporte, 1, 5, 'La calificación de aporte')) return false;
    if (!validarCampoTexto(comentariosEditor, 'El comentario final del editor')) return false;
    return true;
  }

  async function confirmarPublicacion() {
    if (!validarEvaluacionEditor()) return;
    procesando = true;
    try {
      await publicarArticulo(articuloParaValidar.id, {
        scoreMetodologia: Number(scoreMetodologia),
        scoreAporte: Number(scoreAporte),
        comentariosEditor,
      });
      articuloParaValidar = null;
      await cargar();
    } catch (e) {
      error = e.message;
    } finally {
      procesando = false;
    }
  }

  async function confirmarRechazo() {
    if (!validarCampoTexto(comentariosEditor, 'El comentario final del editor (indique el motivo del rechazo)')) return;
    if (!confirm('¿Rechazar definitivamente este manuscrito?')) return;
    procesando = true;
    try {
      await rechazarArticulo(articuloParaValidar.id, {
        scoreMetodologia: scoreMetodologia ? Number(scoreMetodologia) : null,
        scoreAporte: scoreAporte ? Number(scoreAporte) : null,
        comentariosEditor,
      });
      articuloParaValidar = null;
      await cargar();
    } catch (e) {
      error = e.message;
    } finally {
      procesando = false;
    }
  }

  onMount(() => {
    cargar();
    canal = supabase
      .channel('canal-revision-pares-editor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articulos' }, cargar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revisiones' }, cargar)
      .subscribe();
  });

  onDestroy(() => {
    if (canal) supabase.removeChannel(canal);
  });
</script>

<div class="mb-6">
  <p class="text-gray-500 dark:text-gray-400 text-sm">Asignación de revisores y validación final de manuscritos</p>
</div>

{#if error}
  <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
    <span class="material-symbols-outlined text-base">error</span><span>{error}</span>
  </div>
{/if}

<div class="card overflow-x-auto">
  <table class="w-full text-sm">
    <thead>
      <tr class="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400 uppercase text-xs">
        <th class="px-5 py-3">Título del Artículo</th>
        <th class="px-5 py-3">Autor</th>
        <th class="px-5 py-3">Revisor Asignado</th>
        <th class="px-5 py-3">Estado</th>
        <th class="px-5 py-3">Acción</th>
      </tr>
    </thead>
    <tbody>
      {#if cargando}
        <tr><td colspan="5" class="text-center py-8 text-gray-400">Cargando...</td></tr>
      {:else if articulos.length === 0}
        <tr><td colspan="5" class="text-center py-8 text-gray-400">No hay artículos registrados.</td></tr>
      {:else}
        {#each articulos as art}
          <tr class="border-t border-gray-100 dark:border-gray-800">
            <td class="px-5 py-4 font-medium text-gray-900 dark:text-white max-w-xs">{art.titulo}</td>
            <td class="px-5 py-4 text-gray-600 dark:text-gray-300">{art.usuarios?.nombre_completo || 'Desconocido'}</td>
            <td class="px-5 py-4 text-gray-500 dark:text-gray-400">{art.revisor?.nombre_completo || 'Sin asignar'}</td>
            <td class="px-5 py-4"><Tag texto={art.estado} tipo={colorEstadoArticulo(art.estado)} /></td>
            <td class="px-5 py-4">
              {#if art.estado === 'Nueva Presentacion'}
                <button class="btn btn-primary btn-sm" on:click={() => abrirAsignar(art)}>Asignar Revisor</button>
              {:else if art.estado === 'Decision Pendiente'}
                <button class="btn btn-danger btn-sm" on:click={() => abrirValidar(art)}>Validar Publicación</button>
              {:else if art.estado === 'En Revision'}
                <span class="text-xs text-gray-400">Esperando dictamen del revisor...</span>
              {:else}
                <span class="text-xs text-gray-400">—</span>
              {/if}
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<!-- MODAL: ASIGNAR REVISOR -->
{#if articuloParaAsignar}
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" on:click|self={() => (articuloParaAsignar = null)}>
    <div class="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Asignar Revisor</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">"{articuloParaAsignar.titulo}"</p>

      {#if revisores.length === 0}
        <p class="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          No hay revisores aprobados en el sistema. Apruebe usuarios con rol "Revisor" en la sección Usuarios.
        </p>
      {:else}
        <select class="form-control mb-4" bind:value={revisorElegido}>
          <option value="">Seleccione un revisor...</option>
          {#each revisores as r}
            <option value={r.id}>{r.nombre_completo} ({r.correo})</option>
          {/each}
        </select>
        <p class="text-xs text-gray-400 mb-4">Se le dará un plazo de 14 días para completar la revisión.</p>
        <button class="btn btn-primary w-full justify-center py-3" disabled={!revisorElegido || asignando} on:click={confirmarAsignacion}>
          {asignando ? 'Asignando...' : 'Confirmar Asignación'}
        </button>
      {/if}
      <button class="text-xs text-gray-400 hover:underline mt-4 block text-center w-full" on:click={() => (articuloParaAsignar = null)}>Cancelar</button>
    </div>
  </div>
{/if}

<!-- MODAL: VALIDAR PUBLICACIÓN -->
{#if articuloParaValidar}
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" on:click|self={() => (articuloParaValidar = null)}>
    <div class="bg-white dark:bg-gray-900 rounded-xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6">
      <div class="flex items-start justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white pr-4">{articuloParaValidar.titulo}</h2>
        <button class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" on:click={() => (articuloParaValidar = null)}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PdfViewer url={articuloParaValidar.archivo_pdf_url} alto="65vh" />

        <div class="space-y-4">
          {#if revisionDe(articuloParaValidar)}
            {@const rev = revisionDe(articuloParaValidar)}
            <div>
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Recomendación del revisor</span>
              <div class="mt-2">
                <Tag texto={rev.recomendacion} tipo={colorRecomendacion(rev.recomendacion)} />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center text-sm">
              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <p class="text-gray-400 text-xs">Metodología</p><p class="font-semibold text-gray-800 dark:text-gray-100">{rev.nota_metodologia ?? '-'}</p>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <p class="text-gray-400 text-xs">Aporte</p><p class="font-semibold text-gray-800 dark:text-gray-100">{rev.nota_aporte ?? '-'}</p>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <p class="text-gray-400 text-xs">Redacción</p><p class="font-semibold text-gray-800 dark:text-gray-100">{rev.nota_redaccion ?? '-'}</p>
              </div>
            </div>
            <div>
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Comentario confidencial del revisor (para usted)</span>
              <p class="mt-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                {rev.comentarios_editor || 'Sin comentarios adicionales.'}
              </p>
            </div>
          {:else}
            <p class="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">No se encontró la revisión asociada.</p>
          {/if}

          <div class="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">Su evaluación final como Editor</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Calificación Metodología</label>
                <input class="form-control" placeholder="1-5" bind:value={scoreMetodologia} />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Calificación Aporte</label>
                <input class="form-control" placeholder="1-5" bind:value={scoreAporte} />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Comentario final (decisión editorial)</label>
              <textarea rows="3" class="form-control resize-none" placeholder="Justifique la decisión final..." bind:value={comentariosEditor}></textarea>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button class="btn btn-outline flex-1 justify-center py-3" disabled={procesando} on:click={confirmarRechazo}>
              <span class="material-symbols-outlined text-base">cancel</span> Rechazar
            </button>
            <button class="btn btn-primary flex-1 justify-center py-3" disabled={procesando} on:click={confirmarPublicacion}>
              <span class="material-symbols-outlined text-base">publish</span> {procesando ? 'Procesando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
