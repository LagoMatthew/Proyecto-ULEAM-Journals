# ULEAM Journals — Svelte + Supabase

Reescritura completa del sistema en **Svelte 4 + Vite + Tailwind CSS**, con los 3 roles
(Editor en Jefe, Revisor, Autor) y Biblioteca Digital pública, conectado a tu proyecto
Supabase existente.

## 1. Instalación

```bash
npm install
```

## 2. Configurar credenciales

El archivo `.env` ya viene precargado con la URL y la clave "publishable" que estaban
en tu proyecto original. Si usas otro proyecto de Supabase, edita `.env`:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_KEY=tu-clave-publishable
```

## 3. Actualizar la base de datos (IMPORTANTE)

Este rediseño agrega el rol **Revisor**, la aprobación de usuarios y el dictamen de
revisión por pares, que no existían en el esquema original. Antes de correr la app,
ve al **SQL Editor de Supabase** y ejecuta el archivo `schema.sql` incluido en este
proyecto. Eso hace lo siguiente:

- Permite que `usuarios.rol` quede vacío mientras el registro está pendiente.
- Agrega `usuarios.estado_cuenta` (`Pendiente` / `Aprobado` / `Rechazado`).
- Agrega `articulos.veredicto` y `articulos.comentario_revisor`.
- Crea la cuenta de prueba de Revisor (`maria.lopez@uleam.edu.ec` / `123456`).
- Marca como "Aprobados" a los usuarios que ya tenían un rol asignado (por ejemplo
  tus cuentas demo de Autor y Editor).

## 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173`.

## 5. Compilar para producción

```bash
npm run build
```

Esto genera la carpeta `dist/` lista para desplegar en cualquier hosting estático
(Vercel, Netlify, GitHub Pages, etc.).

## Cuentas de prueba

| Rol            | Correo                        | Contraseña |
|----------------|--------------------------------|------------|
| Autor          | ana.gomez@uleam.edu.ec         | 123456     |
| Editor en Jefe | juan.perez@uleam.edu.ec        | 123456     |
| Revisor        | maria.lopez@uleam.edu.ec       | 123456     |

## Estructura del proyecto

```
src/
  lib/
    supabaseClient.js      Cliente único de Supabase
    db.js                  Todas las consultas (equivalente al DatabaseService anterior)
    stores.js               Store de sesión, de tema (dark mode) y router por hash
    utils.js                 Mapeo de colores de estado/veredicto/rol
    components/
      Sidebar.svelte, Topbar.svelte, Tag.svelte,
      PdfViewer.svelte, Notificaciones.svelte
  routes/
    Login.svelte            Login + registro + recuperar contraseña
    Biblioteca.svelte        Biblioteca digital pública
    autor/                   Nueva Presentación + Mis Artículos
    editor/                  Panel de Control + Revisión por Pares + Usuarios + Configuración
    revisor/                 Bandeja de Revisiones + emisión de veredicto
  App.svelte                 Enrutador raíz y protección de rutas por rol
```

## Flujo de aprobación de usuarios (nuevo)

Ahora el registro público **no asigna un rol automáticamente**. El nuevo usuario
queda en estado `Pendiente` y no puede iniciar sesión hasta que el Editor en Jefe
lo apruebe desde **Usuarios → Solicitudes de Registro Pendientes**, donde además
elige si será Autor, Revisor o Editor.

## Notas de seguridad heredadas del proyecto original

Estas limitaciones ya existían en el código HTML/JS original y **se mantienen**
porque dependen del backend, no del framework de frontend:

1. **Contraseñas en texto plano**: la tabla `usuarios` guarda `password` sin hash.
   Se recomienda migrar a Supabase Auth o al menos aplicar hashing (bcrypt) vía una
   Edge Function antes de producción.
2. **Row Level Security (RLS)**: si no está activo en tus tablas, cualquiera con la
   clave pública podría leer/escribir datos directamente. Revisa el bloque comentado
   al final de `schema.sql`.
3. **Recuperación de contraseña sin verificación de identidad**: sigue sin enviar un
   correo de confirmación; cualquiera que conozca un correo registrado puede
   cambiarle la contraseña. Para producción, esto debería resolverse con Supabase
   Auth (magic link / reset por correo).

Si quieres, puedo ayudarte a resolver cualquiera de estos tres puntos a continuación.
