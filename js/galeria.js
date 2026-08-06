
let fotoActiva = 0;
let fotosRaw = []; 

function iniciarGaleria(producto) {
  fotosRaw = [producto.foto1, producto.foto2, producto.foto3, producto.foto4]
    .filter(f => f && f.trim() !== '');

  if (fotosRaw.length === 0) {
    mostrarSinFotoGaleria();
    return;
  }

  renderizarFotoPrincipal(0);
  renderizarMiniaturas();
}

function urlGaleria(url, ancho) {
  const match = (url || '').match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? `https://lh3.googleusercontent.com/d/${match[1]}=w${ancho}` : url;
}

function renderizarFotoPrincipal(indice) {
  fotoActiva = indice;
  const img = document.getElementById('foto-principal');
  if (!img) return;

  img.src = urlGaleria(fotosRaw[indice], 800);
  img.alt = 'Foto del producto';

  document.querySelectorAll('.miniatura').forEach((m, i) => {
    m.classList.toggle('activa', i === indice);
  });
}

function renderizarMiniaturas() {
  const contenedor = document.getElementById('miniaturas');
  if (!contenedor) return;

  contenedor.innerHTML = fotosRaw.map((foto, i) =>
    `<button class="miniatura ${i === 0 ? 'activa' : ''}" onclick="renderizarFotoPrincipal(${i})">
      <img src="${urlGaleria(foto, 200)}" alt="Miniatura ${i + 1}" loading="lazy">
    </button>`
  ).join('');
}

function mostrarSinFotoGaleria() {
  const contenedor = document.getElementById('galeria-contenedor');
  if (!contenedor) return;
  contenedor.innerHTML = `
    <div class="foto-placeholder" style="height:400px; background:#f5f5f5; border-radius:8px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64" style="color:#ddd;">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="m21 15-5-5L5 21"/>
      </svg>
      <span style="color:#ccc;">Sin foto disponible</span>
    </div>`;
}

function fotoAnterior() {
  const nuevo = (fotoActiva - 1 + fotosRaw.length) % fotosRaw.length;
  renderizarFotoPrincipal(nuevo);
}

function fotoSiguiente() {
  const nuevo = (fotoActiva + 1) % fotosRaw.length;
  renderizarFotoPrincipal(nuevo);
}
