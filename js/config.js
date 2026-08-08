
const CONFIG = {

  whatsapp: '573015636533',

  whatsappDisplay: '301-5636-533',

  apiUrl: 'https://script.google.com/macros/s/AKfycbxOPFZyv01MUCVeelKbnkKunXLYey3LPf6a4dry_MT8lG4Ar8zXwFCBL97YbYVo-Hvg_A/exec',

  mostrarPrecios: false,

  language: 'es-CO'
};

document.addEventListener('DOMContentLoaded', () => {
  const base = `https://wa.me/${CONFIG.whatsapp}`;
  document.querySelectorAll('.js-wa-link').forEach(a => {
    const msg = a.dataset.waMsg;
    a.href = msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
  });
  document.querySelectorAll('.js-wa-text').forEach(el => {
    el.textContent = CONFIG.whatsappDisplay;
  });
});
