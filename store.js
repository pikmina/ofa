/* CONFIGURACIÓN */
const API_URL = "https://script.google.com/macros/s/AKfycbw1luBLVRy54DPKa2dZHkRGpodiJPfmK-_Ci5QvAKI3kZA1WoXbEYCC0_8_PTY3oKELBw/exec"; // ← reemplazar

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("tienda")) return;

  // Obtener productos desde Google Sheets
  const productos = await fetch(API_URL).then(r => r.json());

  // Construir categorías
  const categorias = [...new Set(productos.map(p => p.Categoría))];

  let html = "";
  categorias.forEach(cat => {
    html += `<h2>${cat}</h2><div class="product-list">`;
    productos
      .filter(p => p.Categoría === cat)
      .forEach(p => {
        const precioExp = p.PrecioEXP || 0;
        const precioYen = p.PrecioYenes || 0;

        html += `
        <div class="product">
          <p-title>${p.Nombre}</p-title>
          <small>${p.Descripción}</small>
          
          <p-price>
            ${precioExp > 0 ? `Coste en EXP: ${precioExp}<br>` : ""}
            ${precioYen > 0 ? `Coste en ¥: ${precioYen}<br>` : ""}
          </p-price>

          ${p.Imagen ? `<img src="${p.Imagen}" class="producto-img">` : ""}

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
    if (carrito.length === 0) {
      document.getElementById("carrito").innerHTML = "<i>Carrito vacío</i>";
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

    const box = document.getElementById("carrito");
    box.innerHTML = html;

    // Activar botones de eliminar
    box.querySelectorAll(".btn-remove").forEach(btn => {
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

    const texto =
      `[b]Compra realizada:[/b]\n\n` +
      carrito
        .map(p => {
          let linea = `• ${p.nombre} x${p.cantidad} – `;
          let costo = [];
          if (p.exp > 0) costo.push(`${p.exp * p.cantidad} EXP`);
          if (p.yen > 0) costo.push(`${p.yen * p.cantidad} ¥`);
          return linea + costo.join(" + ");
        })
        .join("\n") +
      `\n\n[b]Total EXP:[/b] ${totalEXP}\n[b]Total ¥:[/b] ${totalYEN}`;

    document.getElementById("mensaje-post").value = texto;
    document.getElementById("form-post").submit();
  };
});
