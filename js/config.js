
const CONFIG = {

  whatsapp: '5555555555',

  whatsappDisplay: '5555-5555',

  apiUrl: 'https://script.google.com/macros/s/AKfycbxFenM_RiFsV9hDrr17uupY175IoTxN8dHIuCfGJM-bTQQ1ijH5FBXxcCH45ZATae--/exec',
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
