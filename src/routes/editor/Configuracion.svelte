<script>
  import { sesion, tema } from '../../lib/stores.js';
</script>

<div class="max-w-2xl space-y-6">
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

  <div class="card p-8">
    <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Perfil</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-gray-500 dark:text-gray-400 mb-1">Nombre</p>
        <p class="font-medium text-gray-900 dark:text-white">{$sesion?.nombre}</p>
      </div>
      <div>
        <p class="text-gray-500 dark:text-gray-400 mb-1">Correo</p>
        <p class="font-medium text-gray-900 dark:text-white">{$sesion?.correo}</p>
      </div>
      <div>
        <p class="text-gray-500 dark:text-gray-400 mb-1">Rol</p>
        <p class="font-medium text-gray-900 dark:text-white">{$sesion?.rol}</p>
      </div>
      <div>
        <p class="text-gray-500 dark:text-gray-400 mb-1">Afiliación</p>
        <p class="font-medium text-gray-900 dark:text-white">{$sesion?.afiliacion || '-'}</p>
      </div>
    </div>
  </div>
</div>
