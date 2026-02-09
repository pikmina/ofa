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

// Colores por categoría
const COLORES = {
  "Armaduras": "#4A90E2",
  "Armas": "#D0021B",
  "Habilidades": "#7ED321",
  "Técnicas": "#BD10E0",
  "Rasgos": "#F5A623",
  "Debilidades": "#9013FE",
  "Accesorios": "#50E3C2",
  "General": "#9B9B9B"
};

document.addEventListener("DOMContentLoaded", async () => {
  // Asegurarnos de que la zona exista
  const tiendaEl = document.getElementById("tienda");
  if (!tiendaEl) return;

  // Mostrar loading mientras carga Google Sheets (si existe un elemento #loader)
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "block";

  // Obtener productos desde Google Sheets
  let productos = [];
  try {
    const res = await fetch(API_URL);
    productos = await res.json();
  } catch (e) {
    console.error('Error cargando productos:', e);
    if (loader) loader.style.display = "none";
    tiendaEl.innerHTML = '<div class="error">Error cargando la tienda.</div>';
    return;
  }

  // === FILTRO POR CATEGORÍA ===
  const categorias = [...new Set(productos.map(p => p.Categoría))];

  let html = "";
  categorias.forEach(cat => {
    html += `<h2>${cat}</h2><div class="product-list">`;

    productos
      .filter(p => p.Categoría === cat)
      .forEach(p => {
        const precioExp = p.PrecioEXP || 0;
        const precioYen = p.PrecioYenes || 0;

        // Usar icono según categoría, o uno genérico si no existe
        const icono = ICONOS[p.Categoría] || "fa-solid fa-box-open";

        const niveles = [
          { nombre: "Nivel 1", exp: p.Nivel1_EXP, yen: p.Nivel1_Yen },
          { nombre: "Nivel 2", exp: p.Nivel2_EXP, yen: p.Nivel2_Yen },
          { nombre: "Nivel 3", exp: p.Nivel3_Yen },
          { nombre: "Nivel 4", exp: p.Nivel4_Yen },
          { nombre: "Nivel 5", exp: p.Nivel5_Yen }
        ].filter(n => n.exp || n.yen);

        html += `
      <div class="product">
        <p-title>${p.Nombre}</p-title>
        <small>${p.Descripción}</small>
        
        <p-price>
          ${precioExp > 0 ? `Precio en EXP: ${precioExp}<br>` : ""}
          ${precioYen > 0 ? `Precio en ¥: ${precioYen}<br>` : ""}
        </p-price>

        <i class="${icono} fa-3x producto-icon"></i>

        ${niveles.length > 0 ? `
  <select class="select-nivel">
    ${niveles.map(n =>
          `<option 
        data-exp="${n.exp || 0}" 
        data-yen="${n.yen || 0}">
        ${n.nombre} – 
        ${n.exp ? n.exp + " EXP " : ""}
        ${n.yen ? n.yen + " ¥" : ""}
      </option>`
        ).join("")}
  </select>
` : ""}

        <button class="btn-add"
                data-nombre="${p.Nombre}"
                data-exp="${precioExp}"
                data-yen="${precioYen}">
          Agregar al carrito
        </button>
      </div>`;
      });

    html += "</div>";
  });

  // Render inicial
  renderProductos();

  // Listener del filtro
  const selectCat = document.getElementById("select-categoria");
  if (selectCat) {
    selectCat.onchange = () => renderProductos(selectCat.value);
  }

  // Ocultar loading después de cargar
  if (loader) loader.style.display = "none";

  /* ==========================
      CARRITO
     ========================== */
  let carrito = [];

  // Agregar al carrito con contador
  document.querySelectorAll(".btn-add").forEach(btn => {
    btn.onclick = () => {
      const nombre = btn.dataset.nombre;
      let exp = Number(btn.dataset.exp);
      let yen = Number(btn.dataset.yen);
      let nivel = "";

      const selector = btn.parentElement.querySelector(".select-nivel");
      if (selector) {
        const opcion = selector.selectedOptions[0];
        exp = Number(opcion.dataset.exp);
        yen = Number(opcion.dataset.yen);
        nivel = opcion.textContent;
      }

      let item = carrito.find(
        i => i.nombre === nombre && i.nivel === nivel
      );

      if (item) {
        item.cantidad++;
      } else {
        carrito.push({
          nombre,
          nivel,
          exp,
          yen,
          cantidad: 1
        });
      }

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

    let html = carrito
      .map((p, index) => {
        let linea = `• ${p.nombre}${p.nivel ? " (" + p.nivel + ")" : ""} x${p.cantidad} – `;

        let costo = [];
        if (p.exp > 0) costo.push(`${p.exp * p.cantidad} EXP`);
        if (p.yen > 0) costo.push(`${p.yen * p.cantidad} ¥`);

        linea += costo.join(" + ");

      const costoStr = costo.join(' + ');

      return `
        <div class="carrito-item">
          <span class="carrito-line">• ${p.nombre} x${p.cantidad} – ${costoStr}
          <button class="btn-remove" data-index="${index}" aria-label="Eliminar" title="Eliminar">✖</button>
        </div></span>`;
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

  /* ========================== FINALIZAR COMPRA ========================== */
  const btnFinalizar = document.getElementById("btn-finalizar");
  if (btnFinalizar) {
    btnFinalizar.onclick = () => {
      if (carrito.length === 0) {
        alert("El carrito está vacío.");
        return;
      }

      const totalEXP = carrito.reduce((s, p) => s + (p.exp * p.cantidad), 0);
      const totalYEN = carrito.reduce((s, p) => s + (p.yen * p.cantidad), 0);

      // Construir líneas del resumen
      const lines = carrito.map(p => {
        const costo = [];
        if (p.exp > 0) costo.push(`${p.exp * p.cantidad} EXP`);
        if (p.yen > 0) costo.push(`${p.yen * p.cantidad} ¥`);
        return `• ${p.nombre} x${p.cantidad} – ${costo.join(' + ')}`;
      }).join('\n');

      // Texto final en BBCode
      const texto = `[b]Compra realizada:[/b]\n\n${lines}\n\n[b]Total EXP:[/b] ${totalEXP}\n[b]Total ¥:[/b] ${totalYEN}`;

      const textarea = document.getElementById("mensaje-post");
      if (textarea) textarea.value = texto;

      const form = document.getElementById("form-post");
      if (!form) {
        alert('No se encontró el formulario de posteo (form-post).');
        return;
      }

      form.submit(); // Enviar automáticamente como antes
    };
  }

});