<script>
  import { onMount, onDestroy } from 'svelte';
  import { listarUsuarios, listarSolicitudesPendientes, aprobarUsuario, rechazarUsuario } from '../../lib/db.js';
  import { supabase } from '../../lib/supabaseClient.js';
  import { colorRol, formatearFecha } from '../../lib/utils.js';
  import Tag from '../../lib/components/Tag.svelte';

  let solicitudes = [];
  let usuarios = [];
  let filtroRol = '';
  let cargando = true;
  let error = '';
  let canal;

  let solicitudEnProceso = null;
  let rolElegido = 'Autor';
  let procesando = false;

  async function cargar() {
    try {
      [solicitudes, usuarios] = await Promise.all([listarSolicitudesPendientes(), listarUsuarios(filtroRol)]);
    } catch (e) {
      error = e.message;
    } finally {
      cargando = false;
    }
  }

  function abrirAprobacion(u) {
    solicitudEnProceso = u;
    rolElegido = 'Autor';
  }

  async function confirmarAprobacion() {
    procesando = true;
    try {
      await aprobarUsuario(solicitudEnProceso.id, rolElegido);
      solicitudEnProceso = null;
      await cargar();
    } catch (e) {
      error = e.message;
    } finally {
      procesando = false;
    }
  }

  async function rechazar(id) {
    if (!confirm('¿Rechazar esta solicitud de registro?')) return;
    try {
      await rechazarUsuario(id);
      await cargar();
    } catch (e) {
      error = e.message;
    }
  }

  onMount(() => {
    cargar();
    canal = supabase
      .channel('canal-usuarios-editor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, cargar)
      .subscribe();
  });

  onDestroy(() => {
    if (canal) supabase.removeChannel(canal);
  });

  $: filtroRol, cargar();
</script>

<div class="mb-6">
  <p class="text-gray-500 dark:text-gray-400 text-sm">Aprobación de solicitudes y directorio de usuarios del sistema</p>
</div>

{#if error}
  <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
    <span class="material-symbols-outlined text-base">error</span><span>{error}</span>
  </div>
{/if}

<!-- SOLICITUDES PENDIENTES -->
<div class="card p-6 mb-6">
  <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
    <span class="material-symbols-outlined text-amber-500">pending_actions</span>
    Solicitudes de Registro Pendientes
    {#if solicitudes.length > 0}<Tag texto={solicitudes.length} tipo="yellow" />{/if}
  </h3>

  {#if solicitudes.length === 0}
    <p class="text-sm text-gray-400">No hay solicitudes pendientes por revisar.</p>
  {:else}
    <div class="space-y-3">
      {#each solicitudes as s}
        <div class="flex items-center justify-between border border-gray-100 dark:border-gray-800 rounded-lg p-4">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{s.nombre_completo}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{s.correo} · {s.afiliacion}</p>
            <p class="text-xs text-gray-400 mt-1">Solicitado el {formatearFecha(s.created_at)}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" on:click={() => rechazar(s.id)}>Rechazar</button>
            <button class="btn btn-primary btn-sm" on:click={() => abrirAprobacion(s)}>Aprobar y Asignar Rol</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- DIRECTORIO DE USUARIOS -->
<div class="card overflow-x-auto">
  <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center justify-between rounded-t-xl">
    <h3 class="font-semibold text-sm text-gray-900 dark:text-white">Directorio de cuentas registradas</h3>
    <select class="form-control w-56" bind:value={filtroRol}>
      <option value="">Todos los usuarios</option>
      <option value="Autor">Autores</option>
      <option value="Revisor">Revisores</option>
      <option value="Editor">Editores</option>
    </select>
  </div>
  <table class="w-full text-sm">
    <thead>
      <tr class="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400 uppercase text-xs">
        <th class="px-5 py-3">Nombre Completo</th>
        <th class="px-5 py-3">Correo Electrónico</th>
        <th class="px-5 py-3">Afiliación</th>
        <th class="px-5 py-3">Rol</th>
      </tr>
    </thead>
    <tbody>
      {#if cargando}
        <tr><td colspan="4" class="text-center py-8 text-gray-400">Cargando...</td></tr>
      {:else if usuarios.length === 0}
        <tr><td colspan="4" class="text-center py-8 text-gray-400">No se encontraron usuarios con ese criterio.</td></tr>
      {:else}
        {#each usuarios as u}
          <tr class="border-t border-gray-100 dark:border-gray-800">
            <td class="px-5 py-4 font-medium text-gray-900 dark:text-white">{u.nombre_completo}</td>
            <td class="px-5 py-4 text-gray-600 dark:text-gray-300">{u.correo}</td>
            <td class="px-5 py-4 text-gray-500 dark:text-gray-400">{u.afiliacion || '-'}</td>
            <td class="px-5 py-4"><Tag texto={u.rol} tipo={colorRol(u.rol)} /></td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<!-- MODAL: APROBAR Y ASIGNAR ROL -->
{#if solicitudEnProceso}
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" on:click|self={() => (solicitudEnProceso = null)}>
    <div class="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Aprobar Usuario</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{solicitudEnProceso.nombre_completo} · {solicitudEnProceso.correo}</p>

      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asignar rol en el sistema</label>
      <select class="form-control mb-4" bind:value={rolElegido}>
        <option value="Autor">Autor</option>
        <option value="Revisor">Revisor</option>
        <option value="Editor">Editor en Jefe</option>
      </select>

      <button class="btn btn-primary w-full justify-center py-3" disabled={procesando} on:click={confirmarAprobacion}>
        {procesando ? 'Guardando...' : 'Confirmar Aprobación'}
      </button>
      <button class="text-xs text-gray-400 hover:underline mt-4 block text-center w-full" on:click={() => (solicitudEnProceso = null)}>Cancelar</button>
    </div>
  </div>
{/if}
