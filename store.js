const TiendaApp = (() => {

  /* ============================
     CONFIG
  ============================ */

  const API_URL = "https://script.google.com/macros/s/AKfycbw1luBLVRy54DPKa2dZHkRGpodiJPfmK-_Ci5QvAKI3kZA1WoXbEYCC0_8_PTY3oKELBw/exec";

  const ICONOS = {
    "Armaduras": "fa-solid fa-shield",
    "Armas": "fa-solid fa-gun",
    "Habilidades": "fa-solid fa-hand-fist",
    "Técnicas": "fa-solid fa-burst",
    "Rasgos": "fa-solid fa-person-burst",
    "Debilidades": "fa-solid fa-person-falling-burst",
    "Accesorios": "fa-solid fa-screwdriver-wrench",
    "General": "fa-solid fa-gear",
    "Quirk": "fa-solid fa-bolt",
    "Medicina": "fa-solid fa-pills",
    "Estimulantes": "fa-solid fa-flask",
    "Experimentales": "fa-solid fa-flask-vial",
    "Certificaciones": "fa-solid fa-certificate",
    "Materiales": "fa-solid fa-toolbox",
    "Ingredientes": "fa-brands fa-pagelines"
  };

  const COLORES = {
    "Armaduras": "#2C6FB8",
    "Armas": "#A1121F",
    "Habilidades": "#3F7F1E",
    "Técnicas": "#7A1494",
    "Rasgos": "#B87414",
    "Debilidades": "#5E0FB8",
    "Accesorios": "#1F8F7A",
    "General": "#4A4A4A",
    "Quirk": "#B59B00",
    "Medicina": "#2F5F14",
    "Estimulantes": "#5C8F3A",
    "Experimentales": "#4B1F63",
    "Certificaciones": "#8F4A1F",
    "Materiales": "#3A3A3A",
    "Ingredientes": "#1F4A1F"
  };

  /* ============================
     ESTADO
  ============================ */

  let productos = [];
  let carrito = [];
  let categoriaActiva = null;
  let monedaActiva = [];
  let textoBusqueda = "";

  /* ============================
     INIT
  ============================ */

  function init() {

    if (!document.getElementById("tienda")) return;

    activarEventos();

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        productos = data;
        generarCategorias();
        renderProductos();
      })
      .catch(err => console.error("Error tienda:", err));
  }

  /* ============================
     EVENTOS
  ============================ */

  function activarEventos() {

    // Buscador
    const buscador = document.getElementById("filtro-texto");
    if (buscador) {
      buscador.addEventListener("input", e => {
        textoBusqueda = e.target.value.toLowerCase();
        renderProductos();
      });
    }

    // Filtro moneda
    document.querySelectorAll("#filtro-costes input").forEach(chk => {
      chk.addEventListener("change", () => {
        monedaActiva = [...document.querySelectorAll("#filtro-costes input:checked")]
          .map(c => c.value);
        renderProductos();
      });
    });

    // Finalizar compra
    const btnFinalizar = document.getElementById("btn-finalizar");

    if (btnFinalizar) {
      btnFinalizar.addEventListener("click", finalizarCompra);
    }
  }

  /* ============================
     GENERAR CATEGORÍAS
  ============================ */

  function generarCategorias() {

    const cont = document.getElementById("filtro-categorias");
    if (!cont) return;

    const categorias = [...new Set(productos.map(p => p.Categoría))].filter(Boolean);

    cont.innerHTML = "";

    categorias.forEach(cat => {

      const label = document.createElement("label");

      label.innerHTML = `
        <input type="radio" name="categoria" value="${cat}">
        ${cat}
      `;

      label.querySelector("input").addEventListener("change", () => {
        categoriaActiva = cat;
        renderProductos();
      });

      cont.appendChild(label);
      cont.appendChild(document.createElement("br"));
    });
  }

  /* ============================
     FILTRADO + RENDER
  ============================ */

function renderProductos() {

  const cont = document.getElementById("tienda");
  if (!cont) return;

  cont.innerHTML = "";

  const filtrados = productos.filter(p => {

    const coincideCategoria =
      !categoriaActiva || p.Categoría === categoriaActiva;

    const coincideMoneda =
      monedaActiva.length === 0 || monedaActiva.includes(p.Moneda);

    const coincideTexto =
      !textoBusqueda ||
      (p.Nombre || "").toLowerCase().includes(textoBusqueda) ||
      (p.Descripción || "").toLowerCase().includes(textoBusqueda);

    return coincideCategoria && coincideMoneda && coincideTexto;
  });

  filtrados.forEach(prod => {

    const categoria = prod.Categoría || "General";
    const color = COLORES[categoria] || "#666";

    const card = document.createElement("div");
    card.classList.add("product");

    card.innerHTML = `
      <div class="product-header">
        <div class="product-category" style="border-color:${color}; color:${color};">
          ${categoria}
        </div>
      </div>

      <p-title>${prod.Nombre || ""}</p-title>

      <div class="product-description">
        ${prod.Descripción || ""}
      </div>

      <p-price>${prod.Costo} ${prod.Moneda}</p-price>

      <button class="btn-add">Agregar</button>
    `;

    card.querySelector(".btn-add")
      .addEventListener("click", () => {
        carrito.push(prod);
        renderCarrito();
      });

    cont.appendChild(card);
  });
}

  /* ============================
     CARRITO
  ============================ */

function renderCarrito() {

  const cont = document.getElementById("carrito");
  if (!cont) return;

  cont.innerHTML = "";

  let total = 0;

  carrito.forEach((item, i) => {

    total += Number(item.Costo) || 0;

    const linea = document.createElement("span");
    linea.classList.add("carrito-line");

    linea.innerHTML = `
      ${item.Nombre} — ${item.Costo} ${item.Moneda}
      <button class="btn-remove" data-index="${i}">✕</button>
    `;

    linea.querySelector(".btn-remove")
      .addEventListener("click", () => {
        carrito.splice(i, 1);
        renderCarrito();
      });

    cont.appendChild(linea);
  });

  const totalDiv = document.createElement("div");
  totalDiv.classList.add("carrito-totales");
  totalDiv.innerHTML = `<strong>Total: ${total}</strong>`;

  cont.appendChild(totalDiv);
}

  /* ============================
     FINALIZAR COMPRA
  ============================ */

  function finalizarCompra() {

    if (carrito.length === 0) return;

    const textarea = document.getElementById("mensaje-post");
    const form = document.getElementById("form-post");

    if (!textarea || !form) return;

    let mensaje = "[b]Compra realizada:[/b]\n\n";

    carrito.forEach(item => {
      mensaje += `• ${item.Nombre} — ${item.Costo} ${item.Moneda}\n`;
    });

    textarea.value = mensaje;

    form.submit();
  }

  /* ============================
     API PÚBLICA
  ============================ */

  return { init };

})();

document.addEventListener("DOMContentLoaded", () => {
  TiendaApp.init();
});