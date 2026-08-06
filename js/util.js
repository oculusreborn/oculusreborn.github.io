
function escaparHTML(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escaparArg(valor) {
  return String(valor ?? '')
    .replace(/\\/g, '\\\\')   
    .replace(/'/g, "\\'")      
    .replace(/"/g, '&quot;')   
    .replace(/</g, '\\x3C')    
    .replace(/\r?\n/g, '\\n');
}

const STOCK_UMBRAL = 0; 

function parsearCantidad(valor) {
  if (valor === '' || valor === null || valor === undefined) return null;
  const n = parseInt(valor);
  return isNaN(n) ? null : n;
}

function estaAgotado(cantidad) {
  return cantidad !== null && cantidad <= 0;
}

function etiquetaStock(cantidad) {
  if (cantidad === null) return '';
  if (cantidad <= 0) return '<span class="stock stock--agotado">Agotado</span>';
  if (cantidad <= STOCK_UMBRAL) return `<span class="stock stock--bajo">¡Solo quedan ${cantidad}!</span>`;
  return '';
}
