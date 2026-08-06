
const WA_NUMERO = CONFIG.whatsapp;
const WA_BASE = 'https://wa.me/';

function generarLinkWhatsApp(nombre, precio) {
  const mensaje = `Hola, me interesa el producto: ${nombre} - Precio: $ ${precio.toLocaleString('es-CO')}`;
  return `${WA_BASE}${WA_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

function abrirWhatsAppGeneral() {
  const mensaje = 'Hola, me gustaría recibir información sobre sus productos.';
  window.open(`${WA_BASE}${WA_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');
}
