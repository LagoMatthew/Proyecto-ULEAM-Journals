import { supabase } from './supabaseClient.js';

// ============ AUTENTICACIÓN ============

export async function validarLogin(correo, clave) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('correo', correo)
    .eq('password', clave)
    .single();

  if (error || !data) throw new Error('Correo o contraseña incorrectos.');

  if (data.estado_cuenta === 'Pendiente') {
    throw new Error('Su cuenta está pendiente de aprobación por el Editor en Jefe.');
  }
  if (data.estado_cuenta === 'Rechazado') {
    throw new Error('Su solicitud de registro fue rechazada. Contacte al administrador.');
  }
  return data;
}

export async function registrarNuevoUsuario({ nombre_completo, correo, password, afiliacion }) {
  const { data: existente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('correo', correo)
    .maybeSingle();
  if (existente) throw new Error('Ya existe una cuenta registrada con ese correo.');

  const { error } = await supabase.from('usuarios').insert([
    {
      nombre_completo,
      correo,
      password,
      afiliacion,
      rol: null,
      estado_cuenta: 'Pendiente',
    },
  ]);
  if (error) throw new Error('No se pudo completar el registro: ' + error.message);
  return true;
}

export async function cambiarPassword(correo, nuevaClave) {
  const { data: usuario, error: errBusqueda } = await supabase
    .from('usuarios')
    .select('id')
    .eq('correo', correo)
    .maybeSingle();
  if (errBusqueda || !usuario) throw new Error('No existe una cuenta con ese correo.');

  const { error } = await supabase
    .from('usuarios')
    .update({ password: nuevaClave })
    .eq('id', usuario.id);
  if (error) throw new Error('No se pudo actualizar la contraseña.');
  return true;
}

// ============ ARCHIVOS (PDF) ============

export async function subirPdf(archivo) {
  const nombreLimpio = archivo.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '');
  const nombreUnico = Date.now() + '_' + nombreLimpio;

  const { error } = await supabase.storage.from('Manuscritos').upload(nombreUnico, archivo);
  if (error) throw new Error('Fallo al subir el archivo: ' + error.message);

  const { data } = supabase.storage.from('Manuscritos').getPublicUrl(nombreUnico);
  return data.publicUrl;
}

// ============ ARTÍCULOS ============

export async function guardarArticulo(datos) {
  const { data, error } = await supabase.from('articulos').insert([datos]).select().single();
  if (error) throw new Error('Fallo al registrar el artículo: ' + error.message);
  return data;
}

export async function guardarCoautores(articulo_id, lista) {
  if (!lista || lista.length === 0) return true;
  const registros = lista.map((c) => ({
    articulo_id,
    nombre_completo: c.nombre,
    correo: c.correo,
    afiliacion: c.afiliacion,
  }));
  const { error } = await supabase.from('coautores').insert(registros);
  if (error) throw new Error('Fallo al guardar coautores: ' + error.message);
  return true;
}

export async function listarArticulos() {
  const { data, error } = await supabase
    .from('articulos')
    .select(
      `id, titulo, abstract, palabras_clave, estado, fecha_envio, archivo_pdf_url,
       score_metodologia, score_aporte, comentarios_editor, decision_editor,
       revisor_id, autor_principal_id,
       usuarios!articulos_autor_principal_id_fkey(nombre_completo, correo),
       revisor:usuarios!articulos_revisor_id_fkey(nombre_completo),
       revisiones(nota_metodologia, nota_aporte, nota_redaccion, comentarios_autor, comentarios_editor, recomendacion, estado_revision, fecha_limite)`
    )
    .order('fecha_envio', { ascending: false });
  if (error) throw new Error('Error BD: ' + error.message);
  return data || [];
}

export async function listarArticulosPorAutor(autorId) {
  const { data, error } = await supabase
    .from('articulos')
    .select(
      `id, titulo, estado, fecha_envio, archivo_pdf_url,
       revisiones(comentarios_autor, recomendacion, estado_revision)`
    )
    .eq('autor_principal_id', autorId)
    .order('fecha_envio', { ascending: false });
  if (error) throw new Error('Error BD: ' + error.message);
  return data || [];
}

export async function listarArticulosPublicados() {
  const { data, error } = await supabase
    .from('articulos')
    .select(
      `id, titulo, abstract, palabras_clave, archivo_pdf_url, fecha_envio,
       usuarios!articulos_autor_principal_id_fkey(nombre_completo)`
    )
    .eq('estado', 'Publicado')
    .order('fecha_envio', { ascending: false });
  if (error) throw new Error('Error BD: ' + error.message);
  return data || [];
}

export async function listarArticulosAsignados(revisorId) {
  const { data, error } = await supabase
    .from('revisiones')
    .select(
      `id, nota_metodologia, nota_aporte, nota_redaccion, comentarios_autor, comentarios_editor,
       recomendacion, estado_revision, fecha_limite,
       articulos(id, titulo, abstract, palabras_clave, archivo_pdf_url, fecha_envio,
         usuarios!articulos_autor_principal_id_fkey(nombre_completo))`
    )
    .eq('revisor_id', revisorId)
    .order('fecha_limite', { ascending: true });
  if (error) throw new Error('Error BD: ' + error.message);
  return data || [];
}

export async function asignarRevisor(articuloId, revisorId, diasPlazo = 14) {
  const { error: errArticulo } = await supabase
    .from('articulos')
    .update({ revisor_id: revisorId, estado: 'En Revision' })
    .eq('id', articuloId);
  if (errArticulo) throw new Error('Error al asignar revisor: ' + errArticulo.message);

  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + diasPlazo);

  const { error: errRevision } = await supabase.from('revisiones').insert([
    {
      articulo_id: articuloId,
      revisor_id: revisorId,
      estado_revision: 'Pendiente',
      fecha_limite: fechaLimite.toISOString().slice(0, 10),
    },
  ]);
  if (errRevision) throw new Error('Error al crear la revisión: ' + errRevision.message);
  return true;
}

// El revisor completa su reseña: notas numéricas, comentario para el autor,
// comentario confidencial para el editor y su recomendación final.
export async function emitirRevision(revisionId, articuloId, datos) {
  const { error: errRevision } = await supabase
    .from('revisiones')
    .update({
      nota_metodologia: datos.notaMetodologia,
      nota_aporte: datos.notaAporte,
      nota_redaccion: datos.notaRedaccion,
      comentarios_autor: datos.comentariosAutor,
      comentarios_editor: datos.comentariosEditor,
      recomendacion: datos.recomendacion,
      estado_revision: 'Completada',
    })
    .eq('id', revisionId);
  if (errRevision) throw new Error('Error al guardar la revisión: ' + errRevision.message);

  const { error: errArticulo } = await supabase
    .from('articulos')
    .update({ estado: 'Decision Pendiente' })
    .eq('id', articuloId);
  if (errArticulo) throw new Error('Error al actualizar el artículo: ' + errArticulo.message);
  return true;
}

export async function publicarArticulo(articuloId, datosEditor) {
  const { error } = await supabase
    .from('articulos')
    .update({
      estado: 'Publicado',
      score_metodologia: datosEditor.scoreMetodologia,
      score_aporte: datosEditor.scoreAporte,
      comentarios_editor: datosEditor.comentariosEditor,
      decision_editor: 'Aprobado',
    })
    .eq('id', articuloId);
  if (error) throw new Error('Error al publicar: ' + error.message);
  return true;
}

export async function rechazarArticulo(articuloId, datosEditor) {
  const { error } = await supabase
    .from('articulos')
    .update({
      estado: 'Rechazado',
      score_metodologia: datosEditor?.scoreMetodologia ?? null,
      score_aporte: datosEditor?.scoreAporte ?? null,
      comentarios_editor: datosEditor?.comentariosEditor ?? null,
      decision_editor: 'Rechazado',
    })
    .eq('id', articuloId);
  if (error) throw new Error('Error al rechazar: ' + error.message);
  return true;
}

// ============ USUARIOS ============

export async function listarUsuarios(filtroRol = '') {
  let query = supabase
    .from('usuarios')
    .select('id, nombre_completo, correo, rol, afiliacion, estado_cuenta, created_at')
    .eq('estado_cuenta', 'Aprobado')
    .order('created_at', { ascending: false });

  if (filtroRol) query = query.eq('rol', filtroRol);

  const { data, error } = await query;
  if (error) throw new Error('Error al listar usuarios: ' + error.message);
  return data || [];
}

export async function listarSolicitudesPendientes() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre_completo, correo, afiliacion, created_at')
    .eq('estado_cuenta', 'Pendiente')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Error al listar solicitudes: ' + error.message);
  return data || [];
}

export async function aprobarUsuario(usuarioId, rolAsignado) {
  const { error } = await supabase
    .from('usuarios')
    .update({ estado_cuenta: 'Aprobado', rol: rolAsignado })
    .eq('id', usuarioId);
  if (error) throw new Error('Error al aprobar usuario: ' + error.message);
  return true;
}

export async function rechazarUsuario(usuarioId) {
  const { error } = await supabase
    .from('usuarios')
    .update({ estado_cuenta: 'Rechazado' })
    .eq('id', usuarioId);
  if (error) throw new Error('Error al rechazar usuario: ' + error.message);
  return true;
}

export async function listarRevisores() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre_completo, correo')
    .eq('rol', 'Revisor')
    .eq('estado_cuenta', 'Aprobado');
  if (error) throw new Error('Error al listar revisores: ' + error.message);
  return data || [];
}

// ============ NOTIFICACIONES (calculadas, sin tabla extra) ============

export async function obtenerNotificaciones() {
  const [{ data: nuevas }, { data: listas }, { data: solicitudes }] = await Promise.all([
    supabase.from('articulos').select('id, titulo').eq('estado', 'Nueva Presentacion'),
    supabase.from('articulos').select('id, titulo').eq('estado', 'Decision Pendiente'),
    supabase.from('usuarios').select('id, nombre_completo').eq('estado_cuenta', 'Pendiente'),
  ]);

  const items = [
    ...(nuevas || []).map((a) => ({ tipo: 'nueva', texto: `Nueva presentación: "${a.titulo}"` })),
    ...(listas || []).map((a) => ({ tipo: 'validar', texto: `Listo para validar: "${a.titulo}"` })),
    ...(solicitudes || []).map((u) => ({ tipo: 'registro', texto: `Nuevo registro: ${u.nombre_completo}` })),
  ];

  return { total: items.length, items };
}
