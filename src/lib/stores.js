import { writable } from 'svelte/store';

// ---------- SESIÓN DE USUARIO ----------
function crearSesionStore() {
  let inicial = null;
  try {
    const datos = localStorage.getItem('sesionUsuario');
    if (datos) inicial = JSON.parse(datos);
  } catch (e) {
    inicial = null;
  }

  const { subscribe, set } = writable(inicial);

  return {
    subscribe,
    iniciar(usuario) {
      const sesion = {
        id: usuario.id,
        nombre: usuario.nombre_completo,
        correo: usuario.correo,
        rol: usuario.rol,
        afiliacion: usuario.afiliacion || '',
        login: new Date().toISOString(),
      };
      localStorage.setItem('sesionUsuario', JSON.stringify(sesion));
      set(sesion);
      return sesion;
    },
    cerrar() {
      localStorage.removeItem('sesionUsuario');
      set(null);
    },
  };
}

export const sesion = crearSesionStore();

// ---------- TEMA (MODO OSCURO) ----------
function crearTemaStore() {
  const preferido = localStorage.getItem('tema') || 'light';
  const { subscribe, set, update } = writable(preferido);

  function aplicar(valor) {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', valor === 'dark');
    localStorage.setItem('tema', valor);
  }

  aplicar(preferido);

  return {
    subscribe,
    alternar() {
      update((actual) => {
        const nuevo = actual === 'dark' ? 'light' : 'dark';
        aplicar(nuevo);
        return nuevo;
      });
    },
    establecer(valor) {
      aplicar(valor);
      set(valor);
    },
  };
}

export const tema = crearTemaStore();

// ---------- RUTA ACTUAL (hash router muy simple) ----------
function obtenerHash() {
  const h = window.location.hash.replace(/^#/, '');
  return h || '/login';
}

function crearRutaStore() {
  const { subscribe, set } = writable(obtenerHash());

  window.addEventListener('hashchange', () => set(obtenerHash()));

  return {
    subscribe,
    ir(ruta) {
      window.location.hash = ruta;
    },
  };
}

export const ruta = crearRutaStore();
