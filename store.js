/* CONFIGURACIÓN */
const API_URL = "https://script.google.com/macros/s/AKfycbw1luBLVRy54DPKa2dZHkRGpodiJPfmK-_Ci5QvAKI3kZA1WoXbEYCC0_8_PTY3oKELBw/exec";

const ICONOS = {
  "Armaduras": "fa-solid fa-shield",
  "Armas": "fa-solid fa-gun",
  "Habilidades": "fa-solid fa-hand-fist",
  "Técnicas": "fa-solid fa-burst",
  "Rasgos": "fa-solid fa-person-burst",
  "Debilidades": "fa-solid fa-person-falling-burst",
  "Accesorios": "fa-solid fa-screwdriver-wrench",
  "General": "fa-solid fa-gear"
};

document.addEventListener("DOMContentLoaded", async () => {
  // Asegurarnos de que la zona exista
  if (!document.getElementById("tienda")) return;

  // Mostrar loading mientras carga Google Sheets (si existe un elemento #loader)
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "block";

  // Obtener productos desde Google Sheets
  let productos = [];
  try {
    productos = await fetch(API_URL).then(r => r.json());
  } catch (e) {
    console.error('Error cargando productos:', e);
    if (loader) loader.style.display = "none";
    document.getElementById('tienda').innerHTML = '<div class="error">Error cargando la tienda.</div>';
    return;
  }

  // Generar listado de productos (sin separar por categoría)
  let html = "";

  productos.forEach(p => {
    const precioExp = p.PrecioEXP || 0;
    const precioYen = p.PrecioYenes || 0;
    const icono = ICONOS[p.Categoría] || "fa-solid fa-box-open";

    html += `
      <div class="product">
        <div class="product-header">
          <i class="${icono} fa-2x producto-icon" aria-hidden="true"></i>
          <div class="product-title">
            <p-title>${p.Nombre}</p-title>
            <div class="product-category">${p.Categoría || 'General'}</div>
          </div>
        </div>

        <small>${p.Descripción || ''}</small>

        <p-price>
          ${precioExp > 0 ? `Precio en EXP: ${precioExp}<br>` : ""}
          ${precioYen > 0 ? `Precio en ¥: ${precioYen}<br>` : ""}
        </p-price>

        <button class="btn-add" 
                data-nombre="${p.Nombre}"
                data-exp="${precioExp}"
                data-yen="${precioYen}">
          Agregar al carrito
        </button>
      </div>`;
  });

  document.getElementById("tienda").innerHTML = html;

  // Ocultar loading después de cargar
  if (loader) loader.style.display = "none";

  /* ==========================
      CARRITO
     ========================== */
  let carrito = [];

  // Delegación: los botones pueden agregarse dinámicamente
  document.getElementById('tienda').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add');
    if (!btn) return;
    const nombre = btn.dataset.nombre;
    const exp = Number(btn.dataset.exp) || 0;
    const yen = Number(btn.dataset.yen) || 0;

    let item = carrito.find(i => i.nombre === nombre);
    if (item) item.cantidad++;
    else carrito.push({ nombre, exp, yen, cantidad: 1 });

    renderCarrito();
  });

  function renderCarrito() {
    const caja = document.getElementById("carrito");
    if (!caja) return;

    if (carrito.length === 0) {
      caja.innerHTML = "<i>Carrito vacío</i>";
      return;
    }

    const totalEXP = carrito.reduce((s, p) => s + (p.exp * p.cantidad), 0);
    const totalYEN = carrito.reduce((s, p) => s + (p.yen * p.cantidad), 0);

    let inner = carrito.map((p, index) => {
      const costo = [];
      if (p.exp > 0) costo.push(`${p.exp * p.cantidad} EXP`);
      if (p.yen > 0) costo.push(`${p.yen * p.cantidad} ¥`);

      const costoStr = costo.join(' + ');

      return `
        <div class="carrito-item">
          <span class="carrito-line">• ${p.nombre} x${p.cantidad} – ${costoStr}</span>
          <button class="btn-remove" data-index="${index}" aria-label="Eliminar" title="Eliminar">✖</button>
        </div>`;
    }).join('');

    inner += `<div class="carrito-totales"><b>Total EXP:</b> ${totalEXP}<br><b>Total ¥:</b> ${totalYEN}</div>`;

    caja.innerHTML = inner;

    // Activar botones eliminar
    caja.querySelectorAll('.btn-remove').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.index);
        if (!Number.isNaN(idx)) carrito.splice(idx, 1);
        renderCarrito();
      };
    });
  }

  /* ==========================
      PUBLICAR COMPRA (llenar formulario)
     ========================== */
  const btnFinalizar = document.getElementById("btn-finalizar");
  if (btnFinalizar) {
    btnFinalizar.onclick = () => {
      if (carrito.length === 0) {
        alert("El carrito está vacío.");
        return;
      }

      const totalEXP = carrito.reduce((s, p) => s + (p.exp * p.cantidad), 0);
      const totalYEN = carrito.reduce((s, p) => s + (p.yen * p.cantidad), 0);

      const lines = carrito.map(p => {
        const costo = [];
        if (p.exp > 0) costo.push(`${p.exp * p.cantidad} EXP`);
        if (p.yen > 0) costo.push(`${p.yen * p.cantidad} ¥`);
        return `• ${p.nombre} x${p.cantidad} – ${costo.join(' + ')}`;
      }).join('\n');

      const texto = `[b]Compra realizada:[/b]\n\n${lines}\n\n[b]Total EXP:[/b] ${totalEXP}\n[b]Total ¥:[/b] ${totalYEN}`;

      const textarea = document.getElementById("mensaje-post");
      if (textarea) textarea.value = texto;

      const form = document.getElementById("form-post");
      if (!form) {
        alert('No se encontró el formulario de posteo (form-post).');
        return;
      }

      // No enviamos automáticamente; el formulario ya está rellenado para que el usuario revise y envíe.
    };
  }

});