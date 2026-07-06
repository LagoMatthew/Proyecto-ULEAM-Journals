// =============================================================
// VALIDACIONES.JS
// -------------------------------------------------------------
// Estas funciones reproducen las técnicas de validación vistas
// en clase (Unidad 2 - Validaciones con Javascript): comprobar
// un campo con alert(), validar números con isNaN(), validar
// checkboxes con .checked y validar correos con expresiones
// regulares.
//
// DIFERENCIA CON LOS EJEMPLOS DE CLASE:
// En los ejemplos del PDF se usa document.getElementById("campo").value
// para leer el valor del campo directamente del HTML.
// En Svelte casi nunca usamos getElementById, porque cada input
// ya está "conectado" a una variable con bind:value (esto se llama
// enlace de datos o "data binding"). Esa variable SIEMPRE tiene el
// valor actual del campo, así que en vez de ir a buscarlo al DOM,
// se lo pasamos directo a la función. La lógica de validación
// (el alert, el isNaN, la regex) es exactamente la misma.
// =============================================================

// Validar que un campo de texto no esté vacío (equivale a "validacion()" del PDF)
export function validarCampoTexto(valor, nombreCampo = 'El campo') {
  if (valor === null || valor === undefined || valor.toString().trim().length === 0) {
    alert(nombreCampo + ' no puede estar vacío');
    return false;
  }
  return true;
}

// Validar longitud mínima de texto (usado en el resumen/abstract y la contraseña)
export function validarLongitudMinima(valor, minimo, nombreCampo = 'El campo') {
  if (!valor || valor.toString().trim().length < minimo) {
    alert(nombreCampo + ' debe tener al menos ' + minimo + ' caracteres');
    return false;
  }
  return true;
}

// Validar que un campo sea numérico (equivale a "validaNum()" del PDF)
export function validarNumero(valor, nombreCampo = 'El campo') {
  if (valor === '' || valor === null || isNaN(valor)) {
    alert(nombreCampo + ' tiene que ser numérico');
    return false;
  }
  return true;
}

// Validar una fecha (equivale a "validaFecha()" del PDF).
// NOTA: en la diapositiva original la condición estaba invertida
// ("if (!isNaN(fecha)) return false"), lo cual en realidad rechazaría
// las fechas VÁLIDAS. Aquí se corrige la lógica: solo se rechaza
// cuando la fecha es inválida.
export function validarFecha(valorFecha, nombreCampo = 'La fecha') {
  const fecha = new Date(valorFecha);
  if (!valorFecha || isNaN(fecha.getTime())) {
    alert(nombreCampo + ' no es válida');
    return false;
  }
  return true;
}

// Validar un checkbox obligatorio (equivale a "validaCheck()" del PDF)
export function validarCheckbox(marcado, mensaje = 'Debe aceptar la casilla obligatoria') {
  if (!marcado) {
    alert(mensaje);
    return false;
  }
  return true;
}

// Validar que un número esté dentro de un rango (las notas de revisiones son 1 a 5)
export function validarRango(valor, minimo, maximo, nombreCampo = 'El campo') {
  const numero = Number(valor);
  if (valor === '' || valor === null || isNaN(numero) || numero < minimo || numero > maximo) {
    alert(nombreCampo + ' debe ser un número entre ' + minimo + ' y ' + maximo);
    return false;
  }
  return true;
}

// Validar formato de correo con expresión regular (equivale a "validaEmail()" del PDF)
export function validarEmail(valor) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!regex.test(valor)) {
    alert('El correo electrónico no tiene un formato válido');
    return false;
  }
  return true;
}
