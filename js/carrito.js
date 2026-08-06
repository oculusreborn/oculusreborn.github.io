
const CARRITO_KEY = 'mi_tienda_carrito';

function obtenerCarrito() {
  try { return JSON.parse(localStorage.getItem(CARRITO_KEY)) || []; }
  catch { return []; }
}

function guardarCarrito(items) {
  localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
  actualizarContadorCarrito();
}

function agregarAlCarrito(id, nombre, precio, cantidad, foto, stock) {
  cantidad = parseInt(cantidad) || 1;
  const tope = (stock === undefined || stock === null || stock === '') ? Infinity : Number(stock);
  const items = obtenerCarrito();
  const existente = items.find(i => i.id === id);
  const actual = existente ? existente.cantidad : 0;
  let nueva = actual + cantidad;
  let capado = false;
  if (nueva > tope) { nueva = tope; capado = true; }

  if (existente) {
    existente.cantidad = nueva;
    existente.stock = (tope === Infinity) ? null : tope;
  } else {
    items.push({ id, nombre, precio: Number(precio) || 0, cantidad: nueva, foto: foto || '', stock: (tope === Infinity) ? null : tope });
  }
  guardarCarrito(items);
  renderizarCarrito();
  mostrarToast(capado ? `Solo hay ${tope} unidades disponibles` : `${nombre} agregado a la cotización`);
}

function quitarDelCarrito(id) {
  guardarCarrito(obtenerCarrito().filter(i => i.id !== id));
  renderizarCarrito();
}

function cambiarCantidadCarrito(id, delta) {
  const items = obtenerCarrito();
  const it = items.find(i => i.id === id);
  if (!it) return;
  let nueva = it.cantidad + delta;
  const tope = (it.stock === undefined || it.stock === null) ? Infinity : Number(it.stock);
  if (nueva <= 0) return quitarDelCarrito(id);
  if (nueva > tope) { nueva = tope; mostrarToast(`Solo hay ${tope} unidades disponibles`); }
  it.cantidad = nueva;
  guardarCarrito(items);
  renderizarCarrito();
}

function iconoSinFotoCarrito() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`;
}

function totalCarrito() {
  return obtenerCarrito().reduce((s, i) => s + i.precio * i.cantidad, 0);
}

function contarCarrito() {
  return obtenerCarrito().reduce((s, i) => s + i.cantidad, 0);
}

function actualizarContadorCarrito() {
  const n = contarCarrito();
  document.querySelectorAll('.carrito-contador').forEach(el => {
    el.textContent = n;
    el.style.display = n > 0 ? 'flex' : 'none';
  });
}

function abrirCarrito() {
  renderizarCarrito();
  document.getElementById('carrito-panel')?.classList.add('abierto');
  document.getElementById('carrito-overlay')?.classList.add('abierto');
  document.body.style.overflow = 'hidden';
}

function cerrarCarrito() {
  document.getElementById('carrito-panel')?.classList.remove('abierto');
  document.getElementById('carrito-overlay')?.classList.remove('abierto');
  document.body.style.overflow = '';
}

function renderizarCarrito() {
  const cont = document.getElementById('carrito-items');
  const footer = document.getElementById('carrito-footer');
  if (!cont) return;

  const items = obtenerCarrito();

  if (items.length === 0) {
    cont.innerHTML = `
      <div class="carrito-vacio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" width="56" height="56"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>Tu cotización está vacía</p>
        <span>Agrega productos para cotizarlos por WhatsApp</span>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  cont.innerHTML = items.map(i => {
    const fotoHTML = i.foto
      ? `<img src="${escaparHTML(i.foto)}" alt="${escaparHTML(i.nombre)}" loading="lazy" onerror="this.style.display='none'">`
      : iconoSinFotoCarrito();
    return `
    <div class="carrito-item">
      <div class="carrito-item__foto">${fotoHTML}</div>
      <div class="carrito-item__cuerpo">
        <span class="carrito-item__nombre">${escaparHTML(i.nombre)}</span>
        <span class="carrito-item__id">${escaparHTML(i.id)}</span>
        <div class="carrito-item__fila">
          <span class="carrito-item__precio">$ ${i.precio.toLocaleString('es-CO')}</span>
          <div class="carrito-qty">
            <button onclick="cambiarCantidadCarrito('${escaparArg(i.id)}', -1)" aria-label="Restar">−</button>
            <span>${i.cantidad}</span>
            <button onclick="cambiarCantidadCarrito('${escaparArg(i.id)}', 1)" aria-label="Sumar">+</button>
          </div>
        </div>
      </div>
      <button class="carrito-item__quitar" onclick="quitarDelCarrito('${escaparArg(i.id)}')" aria-label="Quitar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>`;
  }).join('');

  const totalEl = document.getElementById('carrito-total');
  if (totalEl) totalEl.textContent = '$ ' + totalCarrito().toLocaleString('es-CO');
  if (footer) footer.style.display = 'block';
}

function enviarCotizacion() {
  const items = obtenerCarrito();
  if (items.length === 0) return;

  let msg = 'Hola, me gustaría cotizar estos productos:\n\n';
  items.forEach(i => {
    msg += `• ${i.nombre} (${i.id}) x${i.cantidad} = L ${(i.precio * i.cantidad).toLocaleString('es-CO')}\n`;
  });
  msg += `\nTotal estimado: $ ${totalCarrito().toLocaleString('es-CO')}`;

  const numero = (typeof WA_NUMERO !== 'undefined') ? WA_NUMERO : CONFIG.whatsapp;
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
}

let toastTimer;
function mostrarToast(texto) {
  let toast = document.getElementById('carrito-toast');
  if (!toast) return;
  toast.textContent = texto;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}

function inyectarUICarrito() {
  if (document.getElementById('carrito-panel')) return;

  const html = `
    <div class="carrito-overlay" id="carrito-overlay" onclick="cerrarCarrito()"></div>
    <aside class="carrito-panel" id="carrito-panel" aria-label="Cotización">
      <div class="carrito-panel__header">
        <span>Mi Cotización</span>
        <button onclick="cerrarCarrito()" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="carrito-panel__items" id="carrito-items"></div>
      <div class="carrito-panel__footer" id="carrito-footer" style="display:none;">
        <div class="carrito-panel__total">
          <span>Total estimado:</span>
          <strong id="carrito-total">$ 0</strong>
        </div>
        <button class="carrito-panel__enviar" onclick="enviarCotizacion()">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Enviar cotización por WhatsApp
        </button>
      </div>
    </aside>
    <div class="carrito-toast" id="carrito-toast"></div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

document.addEventListener('DOMContentLoaded', () => {
  inyectarUICarrito();
  actualizarContadorCarrito();
});
