export function colorEstadoArticulo(estado) {
  switch (estado) {
    case 'Nueva Presentacion':
      return 'yellow';
    case 'En Revision':
      return 'blue';
    case 'Decision Pendiente':
      return 'blue';
    case 'Publicado':
      return 'green';
    case 'Rechazado':
      return 'red';
    default:
      return 'gray';
  }
}

export function colorRecomendacion(recomendacion) {
  switch (recomendacion) {
    case 'Aceptar':
      return 'green';
    case 'Revisiones Menores':
    case 'Revisiones Mayores':
      return 'yellow';
    case 'Rechazar':
      return 'red';
    default:
      return 'gray';
  }
}

export function colorRol(rol) {
  switch (rol) {
    case 'Editor':
      return 'yellow';
    case 'Revisor':
      return 'blue';
    case 'Autor':
      return 'green';
    default:
      return 'gray';
  }
}

export function formatearFecha(fechaISO) {
  if (!fechaISO) return '-';
  const f = new Date(fechaISO);
  return f.toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Estos 4 textos deben coincidir EXACTO con el CHECK de la columna
// "recomendacion" en la tabla revisiones (si cambian en la BD, cambiar aquí también).
export const RECOMENDACIONES = ['Aceptar', 'Revisiones Menores', 'Revisiones Mayores', 'Rechazar'];
