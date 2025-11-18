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
  if (!document.getElementById("tienda")) return;

  const productos = await fetch(API_URL).then(r => r.json());

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
      CARRITO
     ========================== */
  let carrito = [];

  document.querySelectorAll(".btn-add").forEach(btn => {
    btn.onclick = () => {
      const nombre = btn.dataset.nombre;
      const exp = Number(btn.dataset.exp);
      const yen = Number(btn.dataset.yen);

      let item = carrito.find(i => i.nombre === nombre);

      if (item) item.cantidad++;
      else carrito.push({ nombre, exp, yen, cantidad: 1 });

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

    let html = carrito.map((p, index) => {
      let costo = [];
      if (p.exp > 0) costo.push(`${p.exp * p.cantidad} EXP`);
      if (p.yen > 0) costo.push(`${p.yen * p.cantidad} ¥`);

      // Use \n inside join so the resulting string is safe
      const costoStr = costo.join(" + ");

      return `• ${p.nombre} x${p.cantidad} – ${costoStr} ` +
             `<button class="btn-remove" data-index="${index}" style="margin-left:8px;"><i class="fa-solid fa-circle-xmark"></i></button>`;
    }).join("<br>");

    caja.innerHTML = html + `<br><br><b>Total EXP:</b> ${totalEXP}<br><b>Total ¥:</b> ${totalYEN}`;

    caja.querySelectorAll(".btn-remove").forEach(btn => {
      btn.onclick = () => {
        carrito.splice(Number(btn.dataset.index), 1);
        renderCarrito();
      };
    });
  }

  /* ==========================
      PUBLICAR COMPRA
     ========================== */
  document.getElementById("btn-finalizar").onclick = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío.");
      return;
    }

    const totalEXP = carrito.reduce((s, p) => s + (p.exp * p.cantidad), 0);
    const totalYEN = carrito.reduce((s, p) => s + (p.yen * p.cantidad), 0);

    const lines = carrito.map(p => {
      let costo = [];
      if (p.exp > 0) costo.push(`${p.exp * p.cantidad} EXP`);
      if (p.yen > 0) costo.push(`${p.yen * p.cantidad} ¥`);
      return `• ${p.nombre} x${p.cantidad} – ${costo.join(' + ')}`;
    }).join("\n");

    const texto = `[b]Compra realizada:[/b]\n\n${lines}\n\n[b]Total EXP:[/b] ${totalEXP}\n[b]Total ¥:[/b] ${totalYEN}`;

    const textarea = document.getElementById("mensaje-post");
    if (textarea) textarea.value = texto;

    const form = document.getElementById("form-post");
    if (!form) {
      alert('No se encontró el formulario de posteo (form-post). El mensaje fue copiado al portapapeles.');
      // copiar al portapapeles como fallback
      try { navigator.clipboard.writeText(texto); } catch(e){}
      return;
    }

    // Mostrar loading si existe
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "block";

    // Enviar post automáticamente sin abrir vista previa
    const send = document.createElement("input");
    send.type = "hidden";
    send.name = "post";
    send.value = "Enviar";
    form.appendChild(send);

    form.submit();
  };
});