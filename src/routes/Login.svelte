<script>
  // Este componente maneja las 3 pantallas de acceso: login, registro
  // y recuperar contraseña. Se validan los campos con las mismas
  // funciones (alert + isNaN + regex) que se explicaron en clase,
  // ubicadas en lib/validaciones.js
  import { validarLogin, registrarNuevoUsuario, cambiarPassword } from '../lib/db.js';
  import { sesion, ruta } from '../lib/stores.js';
  import { validarCampoTexto, validarLongitudMinima, validarCheckbox, validarEmail } from '../lib/validaciones.js';

  let vista = 'login'; // login | registro | recuperar

  // --- LOGIN ---
  let correo = '';
  let password = '';
  let verPassword = false;
  let errorLogin = '';
  let cargandoLogin = false;

  async function procesarLogin(e) {
    e.preventDefault();
    errorLogin = '';

    // Validaciones tipo "alert()" (igual que en el material de clase)
    if (!validarCampoTexto(correo, 'El correo')) return;
    if (!validarCampoTexto(password, 'La contraseña')) return;
    if (!validarEmail(correo)) return;

    cargandoLogin = true;
    try {
      const usuario = await validarLogin(correo, password);
      const nueva = sesion.iniciar(usuario);
      ruta.ir('/' + nueva.rol.toLowerCase());
    } catch (err) {
      errorLogin = err.message;
    } finally {
      cargandoLogin = false;
    }
  }

  function rellenarCredenciales(c, p) {
    correo = c;
    password = p;
    errorLogin = '';
  }

  // --- REGISTRO ---
  let regNombre = '';
  let regCorreo = '';
  let regPassword = '';
  let regAfiliacion = '';
  let regAceptaTerminos = false;
  let errorRegistro = '';
  let okRegistro = false;
  let cargandoRegistro = false;

  async function procesarRegistro(e) {
    e.preventDefault();
    errorRegistro = '';
    okRegistro = false;

    // Validaciones campo por campo con alert() (como en el material de la Unidad 2)
    if (!validarCampoTexto(regNombre, 'El nombre completo')) return;
    if (!validarCampoTexto(regCorreo, 'El correo')) return;
    if (!validarEmail(regCorreo)) return;
    if (!validarLongitudMinima(regPassword, 6, 'La contraseña')) return;
    if (!validarCampoTexto(regAfiliacion, 'La afiliación institucional')) return;
    if (!validarCheckbox(regAceptaTerminos, 'Debe aceptar los términos y condiciones para registrarse')) return;

    cargandoRegistro = true;
    try {
      await registrarNuevoUsuario({
        nombre_completo: regNombre,
        correo: regCorreo,
        password: regPassword,
        afiliacion: regAfiliacion,
      });
      okRegistro = true;
      regNombre = regCorreo = regPassword = regAfiliacion = '';
      regAceptaTerminos = false;
      setTimeout(() => { vista = 'login'; okRegistro = false; }, 2500);
    } catch (err) {
      errorRegistro = err.message;
    } finally {
      cargandoRegistro = false;
    }
  }

  // --- RECUPERAR CONTRASEÑA ---
  let recCorreo = '';
  let recNueva = '';
  let recConfirmar = '';
  let errorRecuperar = '';
  let okRecuperar = false;
  let cargandoRecuperar = false;

  async function procesarRecuperar(e) {
    e.preventDefault();
    errorRecuperar = '';
    okRecuperar = false;

    if (!validarCampoTexto(recCorreo, 'El correo')) return;
    if (!validarEmail(recCorreo)) return;
    if (!validarLongitudMinima(recNueva, 6, 'La nueva contraseña')) return;
    if (recNueva !== recConfirmar) {
      alert('Las contraseñas no coinciden');
      return;
    }

    cargandoRecuperar = true;
    try {
      await cambiarPassword(recCorreo, recNueva);
      okRecuperar = true;
      recCorreo = recNueva = recConfirmar = '';
      setTimeout(() => { vista = 'login'; okRecuperar = false; }, 2000);
    } catch (err) {
      errorRecuperar = err.message;
    } finally {
      cargandoRecuperar = false;
    }
  }
</script>

<div
  class="min-h-screen flex items-center justify-center p-4"
  style="background: linear-gradient(135deg, #0d7377 0%, #095c5f 50%, #1a202c 100%);"
>
  <div class="w-full max-w-md py-8">
    <div class="text-center mb-8">
      <div class="w-14 h-14 mx-auto mb-3 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
        <span class="material-symbols-outlined text-white text-3xl">menu_book</span>
      </div>
      <h1 class="text-3xl font-bold text-white">ULEAM Journals</h1>
      <p class="text-white/60 mt-1 text-sm">Sistema de Gestión de Revistas Científicas</p>
      <button class="text-white/50 text-xs mt-2 hover:underline" on:click={() => ruta.ir('/biblioteca')}>
        Ver Biblioteca Digital pública →
      </button>
    </div>

    {#if vista === 'login'}
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Iniciar Sesión</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Ingrese sus credenciales para continuar</p>

        {#if errorLogin}
          <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            <span class="material-symbols-outlined text-base">error</span>
            <span>{errorLogin}</span>
          </div>
        {/if}

        <form class="space-y-5" on:submit={procesarLogin}>
          <div>
            <label for="inp-correo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correo Electrónico</label>
            <input id="inp-correo" type="email" class="form-control" placeholder="usuario@uleam.edu.ec" bind:value={correo} />
          </div>
          <div>
            <label for="inp-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
            <div class="relative">
              {#if verPassword}
                <input id="inp-password" type="text" class="form-control pr-11" placeholder="••••••••" bind:value={password} />
              {:else}
                <input id="inp-password" type="password" class="form-control pr-11" placeholder="••••••••" bind:value={password} />
              {/if}
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" on:click={() => (verPassword = !verPassword)}>
                <span class="material-symbols-outlined text-xl">{verPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-full justify-center py-3" disabled={cargandoLogin}>
            <span class="material-symbols-outlined text-base">{cargandoLogin ? 'hourglass_empty' : 'login'}</span>
            {cargandoLogin ? 'Verificando...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div class="flex justify-between mt-5">
          <button class="text-xs text-brand-teal hover:underline font-medium" on:click={() => (vista = 'registro')}>
            ¿No tiene cuenta? Registrarse
          </button>
          <button class="text-xs text-gray-400 hover:underline" on:click={() => (vista = 'recuperar')}>
            ¿Olvidó su contraseña?
          </button>
        </div>
      </div>

      <div class="bg-white/[0.07] border border-white/15 rounded-xl p-4 mt-6">
        <p class="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Cuentas de prueba</p>
        <div class="space-y-2">
          <button
            type="button"
            class="flex items-center justify-between w-full bg-white/10 rounded-lg px-3 py-2 hover:bg-white/20 transition-colors text-left"
            on:click={() => rellenarCredenciales('ana.gomez@uleam.edu.ec', '123456')}
          >
            <div>
              <p class="text-white text-xs font-medium">Dra. Ana Gómez</p>
              <p class="text-white/50 text-xs">ana.gomez@uleam.edu.ec · Autor</p>
            </div>
            <span class="material-symbols-outlined text-white/40 text-sm">touch_app</span>
          </button>
          <button
            type="button"
            class="flex items-center justify-between w-full bg-white/10 rounded-lg px-3 py-2 hover:bg-white/20 transition-colors text-left"
            on:click={() => rellenarCredenciales('juan.perez@uleam.edu.ec', '123456')}
          >
            <div>
              <p class="text-white text-xs font-medium">Dr. Juan Pérez</p>
              <p class="text-white/50 text-xs">juan.perez@uleam.edu.ec · Editor en Jefe</p>
            </div>
            <span class="material-symbols-outlined text-white/40 text-sm">touch_app</span>
          </button>
          <button
            type="button"
            class="flex items-center justify-between w-full bg-white/10 rounded-lg px-3 py-2 hover:bg-white/20 transition-colors text-left"
            on:click={() => rellenarCredenciales('maria.lopez@uleam.edu.ec', '123456')}
          >
            <div>
              <p class="text-white text-xs font-medium">Dra. María López</p>
              <p class="text-white/50 text-xs">maria.lopez@uleam.edu.ec · Revisora</p>
            </div>
            <span class="material-symbols-outlined text-white/40 text-sm">touch_app</span>
          </button>
        </div>
      </div>

    {:else if vista === 'registro'}
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Crear Cuenta</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Su solicitud quedará pendiente hasta que el Editor en Jefe la apruebe y le asigne un rol.
        </p>

        {#if errorRegistro}
          <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            <span class="material-symbols-outlined text-base">error</span><span>{errorRegistro}</span>
          </div>
        {/if}
        {#if okRegistro}
          <div class="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            ✓ Registro enviado. Espere la aprobación del Editor en Jefe.
          </div>
        {/if}

        <form class="space-y-4" on:submit={procesarRegistro}>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo *</label>
            <input type="text" class="form-control" placeholder="Dr. Nombre Apellido" bind:value={regNombre} />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico *</label>
            <input type="email" class="form-control" placeholder="usuario@uleam.edu.ec" bind:value={regCorreo} />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña *</label>
            <input type="password" class="form-control" placeholder="Mínimo 6 caracteres" bind:value={regPassword} />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Afiliación Institucional *</label>
            <input type="text" class="form-control" placeholder="Universidad Laica Eloy Alfaro de Manabí" bind:value={regAfiliacion} />
          </div>
          <label class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" class="mt-1" bind:checked={regAceptaTerminos} />
            <span>Acepto los términos y condiciones y confirmo que mis datos son correctos *</span>
          </label>
          <button type="submit" class="btn btn-primary w-full justify-center py-3" disabled={cargandoRegistro}>
            <span class="material-symbols-outlined text-base">{cargandoRegistro ? 'hourglass_empty' : 'person_add'}</span>
            {cargandoRegistro ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>
        <button class="text-xs text-gray-400 hover:underline mt-4 block text-center w-full" on:click={() => (vista = 'login')}>
          ← Volver al inicio de sesión
        </button>
      </div>

    {:else if vista === 'recuperar'}
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Cambiar Contraseña</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Ingrese su correo registrado y establezca una nueva contraseña</p>

        {#if errorRecuperar}
          <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            <span class="material-symbols-outlined text-base">error</span><span>{errorRecuperar}</span>
          </div>
        {/if}
        {#if okRecuperar}
          <div class="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            ✓ Contraseña actualizada correctamente.
          </div>
        {/if}

        <form class="space-y-4" on:submit={procesarRecuperar}>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico *</label>
            <input type="email" class="form-control" placeholder="usuario@uleam.edu.ec" bind:value={recCorreo} />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva Contraseña *</label>
            <input type="password" class="form-control" placeholder="Mínimo 6 caracteres" bind:value={recNueva} />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Contraseña *</label>
            <input type="password" class="form-control" placeholder="Repita la contraseña" bind:value={recConfirmar} />
          </div>
          <button type="submit" class="btn btn-primary w-full justify-center py-3" disabled={cargandoRecuperar}>
            <span class="material-symbols-outlined text-base">{cargandoRecuperar ? 'hourglass_empty' : 'lock_reset'}</span>
            {cargandoRecuperar ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
        <button class="text-xs text-gray-400 hover:underline mt-4 block text-center w-full" on:click={() => (vista = 'login')}>
          ← Volver al inicio de sesión
        </button>
      </div>
    {/if}
  </div>
</div>
