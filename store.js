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
    html += `<h2>${cat}</h2><ul>`;
    productos.filter(p => p.Categoría === cat).forEach(p => {
      html += `
        <li class="producto">
          <b>${p.Nombre}</b> – $${p.Precio}<br>
          <small>${p.Descripción}</small><br>
          ${p.Imagen ? `<img src="${p.Imagen}" class="producto-img">` : ""}
          <button class="btn-add" data-nombre="${p.Nombre}" data-precio="${p.Precio}">
            Agregar al carrito
          </button>
        </li>`;
    });
    html += "</ul>";
  });

  document.getElementById("tienda").innerHTML = html;

  // Carrito
  let carrito = [];

  document.querySelectorAll(".btn-add").forEach(btn => {
    btn.onclick = () => {
      carrito.push({
        nombre: btn.dataset.nombre,
        precio: Number(btn.dataset.precio)
      });
      renderCarrito();
    };
  });

  function renderCarrito() {
    const total = carrito.reduce((s, p) => s + p.precio, 0);

    const html = carrito.length
      ? carrito.map(p => `${p.nombre} – $${p.precio}`).join("<br>") + `<br><b>Total: $${total}</b>`
      : "<i>Carrito vacío</i>";

    document.getElementById("carrito").innerHTML = html;
  }

  // Finalizar compra: postea al foro
  document.getElementById("btn-finalizar").onclick = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío.");
      return;
    }

    const total = carrito.reduce((s, p) => s + p.precio, 0);

    const texto = `[b]Compra realizada:[/b]\n\n`
      + carrito.map(p => `• ${p.nombre} – $${p.precio}`).join("\n")
      + `\n\nTotal: $${total}`;

    document.getElementById("mensaje-post").value = texto;
    document.getElementById("form-post").submit();
  };
});
