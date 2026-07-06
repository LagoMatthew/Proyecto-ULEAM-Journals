<script>
  import Sidebar from '../../lib/components/Sidebar.svelte';
  import Topbar from '../../lib/components/Topbar.svelte';
  import Notificaciones from '../../lib/components/Notificaciones.svelte';
  import PanelControl from './PanelControl.svelte';
  import RevisionPares from './RevisionPares.svelte';
  import Usuarios from './Usuarios.svelte';
  import Configuracion from './Configuracion.svelte';

  let vista = 'panel-control';

  const items = [
    { key: 'panel-control', label: 'Panel de Control', icon: 'grid_view' },
    { key: 'revision-pares', label: 'Revisión por Pares', icon: 'rate_review' },
    { key: 'usuarios', label: 'Usuarios', icon: 'group' },
    { key: 'configuracion', label: 'Configuración', icon: 'settings' },
  ];

  const titulos = {
    'panel-control': 'Panel de Control',
    'revision-pares': 'Gestión de Revisiones',
    usuarios: 'Gestión de Usuarios',
    configuracion: 'Configuración del Sistema',
  };

  function cambiar(e) {
    vista = e.detail;
  }
</script>

<div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
  <Sidebar {items} activo={vista} versionTag="v1.0 Editor en Jefe" on:cambiar={cambiar} />

  <main class="flex-1 flex flex-col overflow-y-auto">
    <Topbar titulo={titulos[vista]}>
      <Notificaciones />
    </Topbar>

    <div class="flex-1 p-8 w-full">
      {#if vista === 'panel-control'}
        <PanelControl on:navegar={(e) => (vista = e.detail)} />
      {:else if vista === 'revision-pares'}
        <RevisionPares />
      {:else if vista === 'usuarios'}
        <Usuarios />
      {:else if vista === 'configuracion'}
        <Configuracion />
      {/if}
    </div>
  </main>
</div>
