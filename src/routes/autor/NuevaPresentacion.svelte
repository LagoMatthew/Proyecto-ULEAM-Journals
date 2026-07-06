<script>
  // Formulario de "Nueva Presentación". Antes de guardar en Supabase,
  // se valida CADA campo con las funciones de lib/validaciones.js,
  // que muestran un alert() igual que las validaciones vistas en
  // clase (campo vacío, numérico, checkbox y fecha).
  import { createEventDispatcher } from 'svelte';
  import { sesion } from '../../lib/stores.js';
  import { subirPdf, guardarArticulo, guardarCoautores } from '../../lib/db.js';
  import PdfViewer from '../../lib/components/PdfViewer.svelte';
  import {
    validarCampoTexto,
    validarLongitudMinima,
    validarNumero,
    validarFecha,
    validarCheckbox,
    validarEmail,
  } from '../../lib/validaciones.js';

  const dispatch = createEventDispatcher();

  let titulo = '';
  let abstractTexto = '';
  let palabras = [];
  let inputPalabra = '';
  let telefonoContacto = '';
  let fechaFinalizacion = '';
  let declaracionOriginalidad = false;
  let coautores = [];
  let archivo = null;
  let previewUrl = '';
  let enviando = false;
  let errorMsg = '';

  function agregarPalabra() {
    const texto = inputPalabra.trim();
    if (texto && !palabras.includes(texto)) {
      palabras = [...palabras, texto];
      inputPalabra = '';
    }
  }

  function quitarPalabra(i) {
    palabras = palabras.filter((_, idx) => idx !== i);
  }

  function agregarCoautor() {
    coautores = [...coautores, { nombre: '', correo: '', afiliacion: '' }];
  }

  function quitarCoautor(i) {
    coautores = coautores.filter((_, idx) => idx !== i);
  }

  function manejarArchivo(e) {
    const f = e.target.files[0];
    if (!f) return;
    archivo = f;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(f);
  }

  // Igual que el "return validar()" del onsubmit de los ejemplos de clase:
  // se revisa un campo a la vez y, apenas uno falla, se corta con el alert()
  // correspondiente (return false) sin seguir revisando los demás.
  function validarFormulario() {
    if (!validarCampoTexto(titulo, 'El título del artículo')) return false;
    if (!validarLongitudMinima(abstractTexto, 50, 'El resumen (abstract)')) return false;
    if (palabras.length === 0) {
      alert('Debe ingresar al menos una palabra clave');
      return false;
    }
    if (!validarNumero(telefonoContacto, 'El teléfono de contacto')) return false;
    if (!validarFecha(fechaFinalizacion, 'La fecha de finalización del manuscrito')) return false;
    if (!validarCheckbox(declaracionOriginalidad, 'Debe declarar que el manuscrito es original e inédito')) return false;

    if (!archivo) {
      alert('Debe adjuntar el PDF del manuscrito');
      return false;
    }
    if (archivo.type !== 'application/pdf') {
      alert('El archivo debe estar en formato PDF');
      return false;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      alert('El PDF no puede superar los 10MB');
      return false;
    }

    for (const c of coautores) {
      if (c.nombre && !validarEmail(c.correo)) return false;
    }
    return true;
  }

  async function enviar(e) {
    e.preventDefault();
    errorMsg = '';
    if (!validarFormulario()) return;

    enviando = true;
    try {
      const urlPdf = await subirPdf(archivo);

      const articuloGuardado = await guardarArticulo({
        autor_principal_id: $sesion.id,
        titulo,
        abstract: abstractTexto,
        palabras_clave: palabras.join(', '),
        archivo_pdf_url: urlPdf,
        telefono_contacto: telefonoContacto,
        fecha_finalizacion: fechaFinalizacion,
        estado: 'Nueva Presentacion',
      });

      const coautoresValidos = coautores.filter((c) => c.nombre.trim());
      if (coautoresValidos.length > 0) {
        await guardarCoautores(articuloGuardado.id, coautoresValidos);
      }

      // Reset del formulario
      titulo = '';
      abstractTexto = '';
      palabras = [];
      telefonoContacto = '';
      fechaFinalizacion = '';
      declaracionOriginalidad = false;
      coautores = [];
      archivo = null;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = '';

      dispatch('enviado');
    } catch (err) {
      errorMsg = 'Ocurrió un problema: ' + err.message;
    } finally {
      enviando = false;
    }
  }
</script>

<div class="mb-6">
  <p class="text-gray-500 dark:text-gray-400 text-sm">Complete todos los campos requeridos para presentar su manuscrito</p>
</div>

{#if errorMsg}
  <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
    <span class="material-symbols-outlined text-base">error</span><span>{errorMsg}</span>
  </div>
{/if}

<form class="space-y-6" on:submit={enviar}>
  <!-- SECCIÓN 1: Metadatos -->
  <div class="card p-8">
    <h3 class="font-semibold text-lg mb-6 pb-3 border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white">
      Sección 1: Metadatos del Manuscrito
    </h3>
    <div class="space-y-6">
      <div>
        <label class="block mb-2 font-medium text-gray-800 dark:text-gray-200">Título del Artículo <span class="text-red-600">*</span></label>
        <input class="form-control" placeholder="Ingrese el título completo del artículo" bind:value={titulo} />
      </div>
      <div>
        <label class="block mb-2 font-medium text-gray-800 dark:text-gray-200">Resumen (Abstract) <span class="text-red-600">*</span></label>
        <textarea rows="6" class="form-control resize-none" placeholder="Escriba el resumen de su investigación (mínimo 50 caracteres)..." bind:value={abstractTexto}></textarea>
        <p class="text-xs text-gray-400 mt-1">{abstractTexto.length} caracteres</p>
      </div>
      <div>
        <label class="block mb-2 font-medium text-gray-800 dark:text-gray-200">Palabras Clave <span class="text-red-600">*</span></label>
        <div class="flex flex-wrap gap-2 mb-3 min-h-[32px]">
          {#each palabras as p, i}
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
              {p}
              <button type="button" class="hover:text-red-600" on:click={() => quitarPalabra(i)}>
                <span class="material-symbols-outlined text-sm leading-none">close</span>
              </button>
            </span>
          {/each}
        </div>
        <div class="flex gap-2">
          <input
            class="form-control"
            placeholder="Agregar palabra clave y presionar Enter"
            bind:value={inputPalabra}
            on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarPalabra())}
          />
          <button type="button" class="btn btn-outline whitespace-nowrap" on:click={agregarPalabra}>Agregar</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block mb-2 font-medium text-gray-800 dark:text-gray-200">Teléfono de Contacto <span class="text-red-600">*</span></label>
          <input class="form-control" placeholder="Ej: 0987654321" bind:value={telefonoContacto} />
          <p class="text-xs text-gray-400 mt-1">Solo números (validación numérica).</p>
        </div>
        <div>
          <label class="block mb-2 font-medium text-gray-800 dark:text-gray-200">Fecha de Finalización del Manuscrito <span class="text-red-600">*</span></label>
          <input type="date" class="form-control" bind:value={fechaFinalizacion} />
        </div>
      </div>
    </div>
  </div>

  <!-- SECCIÓN 2: Autoría -->
  <div class="card p-8">
    <h3 class="font-semibold text-lg mb-6 pb-3 border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white">
      Sección 2: Información de Autoría
    </h3>
    <div class="space-y-6">
      <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h4 class="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-200">Autor Principal</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
            <input class="form-control" value={$sesion?.nombre || ''} disabled />
          </div>
          <div>
            <label class="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Correo de Correspondencia</label>
            <input class="form-control" value={$sesion?.correo || ''} disabled />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Afiliación Institucional</label>
            <input class="form-control" value={$sesion?.afiliacion || ''} disabled />
          </div>
        </div>
      </div>

      {#each coautores as c, i}
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 relative shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400">Coautor #{i + 1}</h4>
            <button type="button" class="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-medium" on:click={() => quitarCoautor(i)}>
              <span class="material-symbols-outlined text-sm">close</span> Quitar
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Nombre Completo *</label>
              <input class="form-control" placeholder="Ej: Ing. Carlos Mendoza" bind:value={c.nombre} />
            </div>
            <div>
              <label class="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Correo Electrónico *</label>
              <input type="email" class="form-control" placeholder="ejemplo@uleam.edu.ec" bind:value={c.correo} />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Afiliación Institucional</label>
              <input class="form-control" placeholder="Universidad, departamento..." bind:value={c.afiliacion} />
            </div>
          </div>
        </div>
      {/each}

      <button
        type="button"
        class="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium border-2 border-dashed border-brand-teal/30 text-brand-teal hover:bg-brand-teal/5 transition-colors"
        on:click={agregarCoautor}
      >
        <span class="material-symbols-outlined">add</span> Añadir Coautor
      </button>
    </div>
  </div>

  <!-- SECCIÓN 3: PDF -->
  <div class="card p-8">
    <h3 class="font-semibold text-lg mb-6 pb-3 border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white">
      Sección 3: Carga y Previsualización de Manuscrito (PDF)
    </h3>

    <div class="border-2 border-dashed border-brand-teal rounded-lg p-8 flex flex-col items-center text-center bg-gray-50 dark:bg-gray-800 mb-4">
      <span class="material-symbols-outlined text-4xl mb-4 text-brand-teal">upload_file</span>
      <p class="font-medium mb-2 text-gray-800 dark:text-gray-100">
        {archivo ? archivo.name : 'Haga clic o arrastre el archivo aquí'}
      </p>
      <p class="text-sm mb-4 text-gray-500 dark:text-gray-400">Solo formato PDF. Máximo 10MB.</p>
      <input
        type="file"
        accept="application/pdf"
        class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-teal file:text-white cursor-pointer"
        on:change={manejarArchivo}
      />
    </div>

    <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vista previa del documento:</p>
    <PdfViewer url={previewUrl} alto="450px" />
  </div>

  <!-- Declaración obligatoria (validación de checkbox) -->
  <label class="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer">
    <input type="checkbox" class="mt-1" bind:checked={declaracionOriginalidad} />
    <span class="text-sm text-gray-700 dark:text-gray-300">
      Declaro que este manuscrito es original, inédito, y no ha sido enviado simultáneamente a otra revista. <span class="text-red-600">*</span>
    </span>
  </label>

  <!-- Botones -->
  <div class="flex items-center justify-end pt-2">
    <button type="submit" class="btn btn-danger px-8 py-3" disabled={enviando}>
      <span class="material-symbols-outlined text-base">{enviando ? 'hourglass_empty' : 'send'}</span>
      {enviando ? 'Enviando...' : 'Enviar Manuscrito'}
    </button>
  </div>
</form>
