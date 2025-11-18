/* CONFIGURACIÓN */
const API_URL = "https://script.google.com/macros/s/AKfycbw1luBLVRy54DPKa2dZHkRGpodiJPfmK-_Ci5QvAKI3kZA1WoXbEYCC0_8_PTY3oKELBw/exec"; // ← reemplazar


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
  if (!document.getElementById("tienda")) return;

  // Obtener productos desde Google Sheets
  const productos = await fetch(API_URL).then(r => r.json());

  // Construir categorías (se mantienen por si las necesitas en el futuro)
  const categorias = [...new Set(productos.map(p => p.Categoría))];

  // Generar listado SIN separar por secciones: cada producto muestra su categoría e ícono
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
            <div class="product-category">${p.Categoría}</div>
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

  /* ==========================
      CARRITO DE COMPRAS
     ========================== */

  let carrito = [];

  // Agregar al carrito con contador
  document.querySelectorAll(".btn-add").forEach(btn => {
    btn.onclick = () => {
      const nombre = btn.dataset.nombre;
      const exp = Number(btn.dataset.exp);
      const yen = Number(btn.dataset.yen);

      let item = carrito.find(i => i.nombre === nombre);

      if (item) {
        item.cantidad++;
      } else {
        carrito.push({
          nombre,
          exp,
          yen,
          cantidad: 1
        });
      }

      renderCarrito();
    };
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
        let linea = `• ${p.nombre} x${p.cantidad} – `;

        let costo = [];
        if (p.exp > 0) costo.push(`${p.exp * p.cantidad} EXP`);
        if (p.yen > 0) costo.push(`${p.yen * p.cantidad} ¥`);

        linea += costo.join(" + ");

        // Botón eliminar
        linea += ` <button class="btn-remove" data-index="${index}" style="margin-left:8px;">✖</button>`;

        return linea;
      })
      .join("<br>");

    html += `<br><br><b>Total EXP:</b> ${totalEXP}`;
    html += `<br><b>Total ¥:</b> ${totalYEN}`;

    caja.innerHTML = html;

    // Activar botones de eliminar
    caja.querySelectorAll(".btn-remove").forEach(btn => {
      btn.onclick = () => {
        const index = Number(btn.dataset.index);
        carrito.splice(index, 1);
        renderCarrito();
      };
    });
  }

  /* ==========================
      FINALIZAR COMPRA
     ========================== */

  document.getElementById("btn-finalizar").onclick = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío.");
      return;
    }

    const totalEXP = carrito.reduce((s, p) => s + (p.exp * p.cantidad), 0);
    const totalYEN = carrito.reduce((s, p) => s + (p.yen * p.cantidad), 0);

    const lines = carrito.map(p => {
      let linea = `• ${p.nombre} x${p.cantidad} – `;
      let costo = [];
      if (p.exp > 0) costo.push(`${p.exp * p.cantidad} EXP`);
      if (p.yen > 0) costo.push(`${p.yen * p.cantidad} ¥`);
      return linea + costo.join(' + ');
    });

    const texto = `[b]Compra realizada:[/b]\n\n${lines.join('\n')}\n\n[b]Total EXP:[/b] ${totalEXP}\n[b]Total ¥:[/b] ${totalYEN}`;

    const textarea = document.getElementById("mensaje-post");
    if (textarea) textarea.value = texto;
    const form = document.getElementById("form-post");
    if (form) form.submit();
  };
});