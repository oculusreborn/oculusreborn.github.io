
const CACHE_KEY = 'mi_tienda_productos';
const CACHE_KEY_BANNERS = 'mi_tienda_banners';
const CACHE_TTL = 30 * 60 * 1000;
const API_URL = CONFIG.apiUrl;

let todosLosProductos = [];
let categoriaActiva = 'Todos';
let terminoBusqueda = '';

const POR_PAGINA = 12;
let paginaActual = 1;

document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();
  cargarBanners();
  iniciarBusqueda();
  iniciarSucursales();
  iniciarDestacadosNav();
});

function iniciarDestacadosNav() {
  const track = document.getElementById('destacados-grid');
  if (!track) return;
  const paso = () => Math.max(track.clientWidth * 0.8, 200);
  document.getElementById('destacados-prev')?.addEventListener('click', () => track.scrollBy({ left: -paso(), behavior: 'smooth' }));
  document.getElementById('destacados-next')?.addEventListener('click', () => track.scrollBy({ left: paso(), behavior: 'smooth' }));
  window.addEventListener('resize', actualizarNavDestacados);
}

const SUCURSALES = [
  {
    nombre: 'Sucursal1',
    ciudad: 'Nombre ciudad',
    principal: true,
    mapa: 'urlGoogleMaps',
  },
];

function iniciarSucursales() {
  const lista = document.getElementById('sucursales-lista');
  const select = document.getElementById('sucursales-select');
  const mapa = document.getElementById('mapa-sucursal');
  if (!lista || !mapa) return;

  lista.innerHTML = SUCURSALES.map((s, i) => `
    <button class="sucursal-item ${i === 0 ? 'activa' : ''}" data-indice="${i}">
      <span class="sucursal-item__icono">📍</span>
      <span class="sucursal-item__texto">
        <span class="sucursal-item__nombre">
          ${s.nombre}
          ${s.principal ? '<span class="sucursal-item__badge">Principal</span>' : ''}
        </span>
        <span class="sucursal-item__ciudad">${s.ciudad}</span>
      </span>
    </button>
  `).join('');

  lista.querySelectorAll('.sucursal-item').forEach(btn => {
    btn.addEventListener('click', () => seleccionarSucursal(parseInt(btn.dataset.indice)));
  });

  if (select) {
    select.innerHTML = SUCURSALES.map((s, i) =>
      `<option value="${i}">📍 ${s.nombre} — ${s.ciudad}${s.principal ? ' (Principal)' : ''}</option>`
    ).join('');
    select.addEventListener('change', () => seleccionarSucursal(parseInt(select.value)));
  }

  mapa.src = SUCURSALES[0].mapa;
}

function seleccionarSucursal(indice) {
  const mapa = document.getElementById('mapa-sucursal');
  if (mapa) mapa.src = SUCURSALES[indice].mapa;

  document.querySelectorAll('.sucursal-item').forEach((btn, i) => {
    btn.classList.toggle('activa', i === indice);
  });

  const select = document.getElementById('sucursales-select');
  if (select && select.value != indice) select.value = indice;
}


async function cargarProductos() {
  const cache = leerCache();

  if (cache) {
    todosLosProductos = cache;
    construirCategorias();
    renderizarTodo();
    revalidarProductos(); 
    return;
  }

  mostrarCargando();
  try {
    const datos = await obtenerProductosFrescos();
    todosLosProductos = datos;
    guardarCache(datos);
    construirCategorias();
    renderizarTodo();
  } catch (error) {
    console.error('Error cargando productos:', error);
    mostrarError();
  }
}

async function obtenerProductosFrescos() {
  const datos = await cargarDesdeSheets();
  return datos.filter(p => p.activo);
}

async function revalidarProductos() {
  try {
    const frescos = await obtenerProductosFrescos();
    if (JSON.stringify(frescos) !== JSON.stringify(todosLosProductos)) {
      todosLosProductos = frescos;
      guardarCache(frescos);
      construirCategorias();
      renderizarTodo();
    }
  } catch (error) {

    console.warn('No se pudo revalidar productos:', error);
  }
}

async function cargarDesdeSheets() {
  const res = await fetch(`${API_URL}?tipo=productos`);
  const filas = await res.json();
  return filas.map(raw => {
    const f = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
    return {
      id:              String(f.id || ''),
      nombre:          String(f.nombre || ''),
      precio:          parseFloat(f.precio) || 0,
      precio_anterior: (f.precio_anterior !== '' && f.precio_anterior !== null && f.precio_anterior !== undefined)
                         ? parseFloat(f.precio_anterior) : null,
      categoria:       String(f.categoria || ''),
      descripcion:     String(f.descripcion || ''),
      foto1:           String(f.foto1 || ''),
      foto2:           String(f.foto2 || ''),
      foto3:           String(f.foto3 || ''),
      foto4:           String(f.foto4 || ''),
      activo:          f.activo === true || String(f.activo).toUpperCase() === 'TRUE',
      destacado:       f.destacado === true || String(f.destacado).toUpperCase() === 'TRUE',
      regalia:         String(f.regalia || ''),
      cantidad:        parsearCantidad(f.cantidad),
      final_oferta:    f.final_oferta || '',
    };
  });
}

async function cargarBanners() {
  const cache = leerCacheBanners();
  if (cache) {
    renderizarBanners(cache);
    revalidarBanners(cache);
    return;
  }
  try {
    const banners = await obtenerBannersFrescos();
    guardarCacheBanners(banners);
    renderizarBanners(banners);
  } catch (e) {
    console.error('Error cargando banners:', e);
    const seccion = document.querySelector('.carrusel');
    if (seccion) seccion.style.display = 'none';
  }
}

async function obtenerBannersFrescos() {
  const res = await fetch(`${API_URL}?tipo=banners`);
  const filas = await res.json();
  return filas
    .map(raw => {
      const f = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
      return {
        orden:  Number(f.orden) || 0,
        link:   String(f.link  || '').trim(),
        activo: f.activo === true || String(f.activo).toUpperCase() === 'TRUE',
      };
    })
    .filter(b => b.activo && b.link !== '')
    .sort((a, b) => a.orden - b.orden);
}

async function revalidarBanners(cached) {
  try {
    const frescos = await obtenerBannersFrescos();
    if (JSON.stringify(frescos) !== JSON.stringify(cached)) {
      guardarCacheBanners(frescos);
      renderizarBanners(frescos);
    }
  } catch { /* silencioso */ }
}

function renderizarBanners(banners) {
  const seccion = document.querySelector('.carrusel');
  const track = document.getElementById('carrusel-track');
  if (!track) return;

  if (banners.length === 0) {
    if (seccion) seccion.style.display = 'none';
    return;
  }

  if (seccion) seccion.style.display = '';
  track.innerHTML = banners.map(b => {
    const fotoURL = convertirLinkDriveBanner(b.link);
    return `<div class="carrusel__slide">
      <img src="${fotoURL}" alt="Banner promocional" loading="lazy">
    </div>`;
  }).join('');
  iniciarCarrusel();
}

function guardarCacheBanners(datos) {
  localStorage.setItem(CACHE_KEY_BANNERS, JSON.stringify({ ts: Date.now(), datos }));
}

function leerCacheBanners() {
  try {
    const raw = localStorage.getItem(CACHE_KEY_BANNERS);
    if (!raw) return null;
    const { ts, datos } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return datos;
  } catch { return null; }
}

function guardarCache(datos) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), datos }));
}

function leerCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, datos } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return datos;
  } catch {
    return null;
  }
}


function normalizar(texto) {
  return (texto || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function filtrarProductos() {
  const termino = normalizar(terminoBusqueda);
  return todosLosProductos.filter(p => {
    const tieneFoto = p.foto1 && p.foto1.trim() !== '';
    const coincideCategoria = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    const coincideBusqueda = termino === '' ||
      normalizar(p.nombre).includes(termino) ||
      normalizar(p.id).includes(termino) ||
      normalizar(p.categoria).includes(termino) ||
      normalizar(p.descripcion).includes(termino);
    return tieneFoto && coincideCategoria && coincideBusqueda;
  });
}


function renderizarTodo() {
  const productos = filtrarProductos();
  renderizarDestacados();
  renderizarGrid(productos);
  actualizarContador(productos.length);
  actualizarTitulo();
}


function iniciarDragDestacados(grid) {
  const DURACION = 45;
  let dragging = false;
  let startX   = 0;
  let baseX    = 0;

  function translateActual() {
    const m = new DOMMatrix(window.getComputedStyle(grid).transform);
    return isNaN(m.m41) ? 0 : m.m41;
  }

  function mitad() { return grid.scrollWidth / 2; }

  function normalizar(x) {
    const h = mitad();
    while (x > 0)  x -= h;
    while (x < -h) x += h;
    return x;
  }

  function reanudar(x) {
    const progreso = Math.abs(normalizar(x)) / mitad();
    const delay    = -(progreso * DURACION);
    grid.style.transform = '';
    grid.style.animation = `destacados-scroll ${DURACION}s linear ${delay}s infinite`;
  }

  grid.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    dragging = true;
    startX   = e.touches[0].clientX;
    baseX    = translateActual();
    grid.style.animation  = 'none';
    grid.style.transform  = `translateX(${baseX}px)`;
  }, { passive: true });

  grid.addEventListener('touchmove', e => {
    if (!dragging || e.touches.length !== 1) return;
    const x = normalizar(baseX + (e.touches[0].clientX - startX));
    grid.style.transform = `translateX(${x}px)`;
  }, { passive: true });

  grid.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    reanudar(translateActual());
  });
}

function renderizarDestacados() {
  const seccion = document.getElementById('seccion-destacados');
  if (!seccion) return;

  const enVistaGeneral = categoriaActiva === 'Todos' && terminoBusqueda === '';
  const destacados = todosLosProductos.filter(p => p.destacado === true || p.destacado === 'TRUE');

  if (!enVistaGeneral || destacados.length === 0) {
    seccion.style.display = 'none';
    return;
  }

  seccion.style.display = 'block';
  const grid = document.getElementById('destacados-grid');
  const nav  = document.querySelector('.destacados__nav');
  const html = destacados.map(p => crearCardHTML(p)).join('');

  if (destacados.length > 4) {

    grid.innerHTML = html + html;
    grid.classList.add('destacados-track--animado');
    seccion.classList.add('destacados--animado');
    if (nav) nav.style.display = 'none';

    if (!grid.dataset.animInit) {
      grid.dataset.animInit = '1';
      iniciarDragDestacados(grid);
    }
  } else {
    grid.innerHTML = html;
    grid.classList.remove('destacados-track--animado');
    seccion.classList.remove('destacados--animado');
    if (nav) nav.style.display = '';
    actualizarNavDestacados();
  }
}

function actualizarNavDestacados() {
  const track = document.getElementById('destacados-grid');
  const nav = document.querySelector('.destacados__nav');
  if (!track || !nav) return;
  const sePuedeDeslizar = track.scrollWidth > track.clientWidth + 5;
  nav.style.display = sePuedeDeslizar ? 'flex' : 'none';
}

function actualizarTitulo() {
  const titulo = document.getElementById('titulo-catalogo');
  if (!titulo) return;
  titulo.textContent = categoriaActiva === 'Todos' ? 'Todos los Productos' : categoriaActiva;
}

function renderizarGrid(productos) {
  const grid = document.getElementById('productos-grid');

  if (productos.length === 0) {
    grid.innerHTML = htmlSinResultados();
    renderizarPaginacion(0);
    return;
  }

  const totalPaginas = Math.ceil(productos.length / POR_PAGINA);
  if (paginaActual > totalPaginas) paginaActual = 1;

  const inicio = (paginaActual - 1) * POR_PAGINA;
  const pagina = productos.slice(inicio, inicio + POR_PAGINA);

  grid.innerHTML = pagina.map(p => crearCardHTML(p)).join('');
  renderizarPaginacion(totalPaginas);
}

function renderizarPaginacion(totalPaginas) {
  const cont = document.getElementById('paginacion');
  if (!cont) return;

  if (totalPaginas <= 1) { cont.innerHTML = ''; return; }

  let botones = '';

  botones += `<button class="pagina-btn pagina-nav" ${paginaActual === 1 ? 'disabled' : ''} onclick="irAPagina(${paginaActual - 1})" aria-label="Anterior">‹</button>`;

  const paginas = calcularPaginasVisibles(paginaActual, totalPaginas);
  paginas.forEach(p => {
    if (p === '...') {
      botones += `<span class="pagina-ellipsis">…</span>`;
    } else {
      botones += `<button class="pagina-btn ${p === paginaActual ? 'activa' : ''}" onclick="irAPagina(${p})">${p}</button>`;
    }
  });

  botones += `<button class="pagina-btn pagina-nav" ${paginaActual === totalPaginas ? 'disabled' : ''} onclick="irAPagina(${paginaActual + 1})" aria-label="Siguiente">›</button>`;

  cont.innerHTML = botones;
}

function calcularPaginasVisibles(actual, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (actual <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (actual >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', actual - 1, actual, actual + 1, '...', total];
}

function irAPagina(n) {
  paginaActual = n;
  renderizarGrid(filtrarProductos());
  const titulo = document.getElementById('titulo-catalogo');
  if (titulo) titulo.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function actualizarContador(total) {
  const el = document.getElementById('contador-productos');
  if (el) el.textContent = total;
}

function crearCardHTML(producto) {
  const tieneOferta = producto.precio_anterior && producto.precio_anterior > producto.precio;
  const descuento = tieneOferta
    ? Math.round((1 - producto.precio / producto.precio_anterior) * 100)
    : 0;

  const fotoID = extraerIdDrive(producto.foto1);
  const fotoURL = producto.foto1 ? convertirLinkDrive(producto.foto1, 600) : null;

  const fotoHTML = fotoURL
    ? `<img src="${escaparHTML(fotoURL)}" alt="${escaparHTML(producto.nombre)}" loading="lazy" onerror="manejarErrorFoto(this, '${escaparArg(fotoID || '')}')">`
    : iconoSinFoto();

  const regaliaHTML = producto.regalia
    ? `<div class="regalia-overlay">
        <img src="${escaparHTML(convertirLinkDrive(producto.regalia, 200))}" alt="Regalo incluido" class="regalia-overlay__img" loading="lazy">
      </div>`
    : '';

  const badgeOferta = tieneOferta
    ? `<span class="producto-card__badge producto-card__badge--oferta">-${descuento}%</span>`
    : '';

  const badgeDestacado = (producto.destacado === true || producto.destacado === 'TRUE')
    ? `<span class="producto-card__badge producto-card__badge--destacado">⭐ Destacado</span>`
    : '';

  const precioAnterior = tieneOferta
    ? `<span class="producto-card__precio-anterior">$ ${producto.precio_anterior.toLocaleString('es-CO')}</span>`
    : '';

  const agotado = estaAgotado(producto.cantidad);
  const stockHTML = etiquetaStock(producto.cantidad);

  const botonHTML = agotado
    ? `<button class="producto-card__btn-cotizar producto-card__btn-cotizar--agotado" disabled onclick="event.stopPropagation();">
          Agotado
        </button>`
    : `<button class="producto-card__btn-cotizar" onclick="event.stopPropagation(); agregarAlCarrito('${escaparArg(producto.id)}', '${escaparArg(producto.nombre)}', ${producto.precio}, 1, '${escaparArg(fotoURL || '')}', ${producto.cantidad === null ? 'null' : producto.cantidad})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Añadir al carrito
        </button>`;

  return `
    <div class="producto-card" onclick="window.location='producto.html?id=${escaparArg(producto.id)}'">
      ${badgeOferta}
      ${badgeDestacado}
      <div class="producto-card__foto">${fotoHTML}${regaliaHTML}</div>
      <div class="producto-card__info">
        <span class="producto-card__categoria">${escaparHTML(producto.categoria)} · <span style="font-weight:600;color:#1B3A6B;">${escaparHTML(producto.id)}</span></span>
        <h3 class="producto-card__nombre">${escaparHTML(producto.nombre)}</h3>
        <div class="producto-card__precios">
          <span class="producto-card__precio ${tieneOferta ? 'producto-card__precio--oferta' : ''}">$ ${producto.precio.toLocaleString('es-CO')}</span>
          ${precioAnterior}
        </div>
        ${stockHTML}
        ${botonHTML}
      </div>
    </div>
  `;
}

function extraerIdDrive(url) {
  const match = (url || '').match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}


function convertirLinkDrive(url, ancho = 800) {
  const id = extraerIdDrive(url);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${ancho}` : url;
}

function convertirLinkDriveBanner(url) {
  const id = extraerIdDrive(url);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1600` : url;
}

function manejarErrorFoto(img, id) {
  if (img.dataset.intento === '1' || !id) {
    img.parentElement.innerHTML = iconoSinFoto();
    return;
  }
  img.dataset.intento = '1';
  img.src = `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
}

function iconoSinFoto() {
  return `<div class="foto-placeholder">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
    <span>Sin foto</span>
  </div>`;
}

function htmlSinResultados() {
  return `<div class="sin-resultados">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <h3>Sin resultados</h3>
    <p>No encontramos productos para tu búsqueda.</p>
  </div>`;
}

function mostrarCargando() {
  const grid = document.getElementById('productos-grid');
  if (grid) grid.innerHTML = `<div class="loading"><div class="spinner"></div><span>Cargando productos...</span></div>`;
}

function mostrarError() {
  const grid = document.getElementById('productos-grid');
  if (grid) grid.innerHTML = `<div class="sin-resultados"><h3>Error al cargar</h3><p>Intenta recargar la página.</p></div>`;
}

function construirCategorias() {
  const unicas = [...new Set(
    todosLosProductos
      .map(p => (p.categoria || '').trim())
      .filter(c => c !== '')
  )];
  const categorias = ['Todos', ...unicas];

  const barraDesktop = document.getElementById('categorias-desktop');
  const barraMovil = document.getElementById('categorias-movil');

  const crearBotones = (contenedor) => {
    if (!contenedor) return;
    contenedor.innerHTML = categorias.map(cat =>
      `<button class="categoria-btn ${cat === categoriaActiva ? 'activo' : ''}" data-categoria="${cat}">${cat}</button>`
    ).join('');

    contenedor.querySelectorAll('.categoria-btn').forEach(btn => {
      btn.addEventListener('click', () => seleccionarCategoria(btn.dataset.categoria));
    });
  };

  crearBotones(barraDesktop);
  crearBotones(barraMovil);
}

function seleccionarCategoria(categoria) {
  categoriaActiva = categoria;
  paginaActual = 1;

  document.querySelectorAll('.categoria-btn').forEach(btn => {
    btn.classList.toggle('activo', btn.dataset.categoria === categoria);
  });

  cerrarMenuMovil();
  renderizarTodo();
}

function iniciarBusqueda() {
  const input = document.getElementById('busqueda-input');
  if (!input) return;

  input.addEventListener('input', (e) => {
    terminoBusqueda = e.target.value.trim();
    paginaActual = 1;

    if (terminoBusqueda !== '' && categoriaActiva !== 'Todos') {
      categoriaActiva = 'Todos';
      document.querySelectorAll('.categoria-btn').forEach(btn => {
        btn.classList.toggle('activo', btn.dataset.categoria === 'Todos');
      });
    }

    renderizarTodo();
  });

  const form = document.getElementById('busqueda-form');
  if (form) form.addEventListener('submit', (e) => e.preventDefault());
}

function toggleMenuMovil() {
  const menu = document.getElementById('menu-movil');
  if (menu) menu.classList.toggle('abierto');
}

function cerrarMenuMovil() {
  const menu = document.getElementById('menu-movil');
  if (menu) menu.classList.remove('abierto');
}

let carruselIntervalo = null;
let carruselListo = false;

function iniciarCarrusel() {
  const track = document.getElementById('carrusel-track');
  const dotsContenedor = document.getElementById('carrusel-dots');
  if (!track || !dotsContenedor) return;

  const slides = track.querySelectorAll('.carrusel__slide');
  const total = slides.length;
  if (total === 0) return;

  let actual = 0;
  if (carruselIntervalo) clearInterval(carruselIntervalo);

  const irA = (indice) => {
    actual = (indice + total) % total;
    track.style.transform = `translateX(-${actual * 100}%)`;
    dotsContenedor.querySelectorAll('.carrusel__dot').forEach((d, i) => {
      d.classList.toggle('activo', i === actual);
    });
  };

  dotsContenedor.innerHTML = Array.from({ length: total }, (_, i) =>
    `<button class="carrusel__dot ${i === 0 ? 'activo' : ''}" aria-label="Banner ${i + 1}"></button>`
  ).join('');
  dotsContenedor.querySelectorAll('.carrusel__dot').forEach((dot, i) => {
    dot.addEventListener('click', () => { irA(i); reiniciarIntervalo(); });
  });

  const iniciarIntervalo = () => {
    if (total > 1) carruselIntervalo = setInterval(() => irA(actual + 1), 6500);
  };
  const reiniciarIntervalo = () => { clearInterval(carruselIntervalo); iniciarIntervalo(); };

  irA(0);
  iniciarIntervalo();

  if (!carruselListo) {
    carruselListo = true;
    document.getElementById('carrusel-prev')?.addEventListener('click', () => { irA(actual - 1); reiniciarIntervalo(); });
    document.getElementById('carrusel-next')?.addEventListener('click', () => { irA(actual + 1); reiniciarIntervalo(); });

    const cont = track.closest('.carrusel');
    cont?.addEventListener('mouseenter', () => clearInterval(carruselIntervalo));
    cont?.addEventListener('mouseleave', iniciarIntervalo);

    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { irA(actual + (diff > 0 ? 1 : -1)); reiniciarIntervalo(); }
    });
  }
}
