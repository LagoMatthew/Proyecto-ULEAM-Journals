<script>
  import { sesion } from '../stores.js';
  export let titulo = '';
</script>

<header class="h-[70px] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 shrink-0">
  <div class="flex items-center gap-4">
    <h2 class="text-lg font-semibold text-brand-teal">{titulo}</h2>
  </div>
  <div class="flex items-center gap-5">
    <slot />
    <div class="flex items-center gap-2.5">
      <div class="flex flex-col items-end leading-tight">
        <strong class="text-sm text-gray-900 dark:text-gray-100">{$sesion?.nombre || 'Cargando...'}</strong>
        <span class="text-xs text-gray-500 dark:text-gray-400">{$sesion?.rol || ''}</span>
      </div>
      <div class="w-9 h-9 bg-brand-teal text-white rounded-full flex items-center justify-center">
        <span class="material-symbols-outlined text-lg">person</span>
      </div>
    </div>
  </div>
</header>
