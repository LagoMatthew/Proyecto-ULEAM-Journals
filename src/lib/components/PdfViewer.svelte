<script>
  export let url = ''; // URL pública o un blob: URL local
  export let alto = '600px';
</script>

{#if url}
  <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800" style="height:{alto}">
    <iframe title="Visor de PDF" src={url} class="w-full h-full" />
  </div>
{:else}
  <div
    class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-center text-gray-400 gap-2"
    style="height:{alto}"
  >
    <span class="material-symbols-outlined text-4xl">picture_as_pdf</span>
    <p class="text-sm">Ningún PDF seleccionado todavía</p>
  </div>
{/if}
