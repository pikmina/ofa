const appTienda = (function () {

  /* ==========================
     CONFIG
  ========================== */

  const API_URL = "https://script.google.com/macros/s/AKfycbw1luBLVRy54DPKa2dZHkRGpodiJPfmK-_Ci5QvAKI3kZA1WoXbEYCC0_8_PTY3oKELBw/exec";

  // Utilidad global segura
  function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

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

  const num = v => Number(v) || 0;

  /* ==========================
     ESTADO
  ========================== */

  let productos = [];
  let carrito = [];

  let filtroTexto = "";
  let categoriasActivas = [];
  let costesActivos = [];

  /* ==========================
     INIT
  ========================== */

  async function init() {

    if (!document.getElementById("tienda")) return;

    productos = await fetch(API_URL).then(r => r.json());

    inicializarFiltros();
    renderTienda(productos);
    activarFinalizar();
  }

  /* ==========================
     FILTROS
  ========================== */

  function inicializarFiltros() {

    const contCategorias = document.getElementById("filtro-categorias");
    if (!contCategorias) return;

    contCategorias.innerHTML = ""; // 🔹 limpiar antes de generar

    const categorias = [...new Set(productos.map(p => p.Categoría))];

    categorias.forEach(cat => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" value="${cat}"> ${cat}`;
      contCategorias.appendChild(label);
    });

    const inputBusqueda = document.getElementById("filtro-texto");
    if (inputBusqueda) {
      inputBusqueda.addEventListener("input", e => {
        filtroTexto = e.target.value.toLowerCase();
        renderTienda(aplicarFiltros());
      });
    }

    document.addEventListener("change", e => {
      if (e.target.matches("#filtro-categorias input, #filtro-costes input")) {

        categoriasActivas = [...document.querySelectorAll("#filtro-categorias input:checked")]
          .map(i => i.value);

        costesActivos = [...document.querySelectorAll("#filtro-costes input:checked")]
          .map(i => i.value);

        renderTienda(aplicarFiltros());
      }
    });
  }

  function aplicarFiltros() {

    return productos.filter(p => {

      const nombreSeguro = (p.Nombre || "").toLowerCase(); // 🔹 blindaje

      if (filtroTexto && !nombreSeguro.includes(filtroTexto))
        return false;

      if (categoriasActivas.length && !categoriasActivas.includes(p.Categoría))
        return false;

      const tieneEXP =
        num(p.PrecioEXP) > 0 ||
        [p.Nivel1_EXP, p.Nivel2_EXP, p.Nivel3_EXP, p.Nivel4_EXP, p.Nivel5_EXP]
          .some(v => num(v) > 0);

      const tieneYEN =
        num(p.PrecioYenes) > 0 ||
        [p.Nivel1_Yen, p.Nivel2_Yen, p.Nivel3_Yen, p.Nivel4_Yen, p.Nivel5_Yen]
          .some(v => num(v) > 0);

      if (costesActivos.length) {
        if (costesActivos.includes("EXP") && tieneEXP) return true;
        if (costesActivos.includes("YEN") && tieneYEN) return true;
        return false;
      }

      return true;
    });
  }

  /* ==========================
     RENDER TIENDA
  ========================== */

  function renderTienda(lista) {

    let html = "";
    const cats = [...new Set(lista.map(p => p.Categoría))];

    cats.forEach(cat => {

      html += `<h2>${cat}</h2><div class="product-list">`;

      lista.filter(p => p.Categoría === cat).forEach(p => {

        const precioExp = num(p.PrecioEXP);
        const precioYen = num(p.PrecioYenes);

        const icono = ICONOS[p.Categoría] || "fa-solid fa-box-open";
        const color = COLORES[p.Categoría] || "#666";

        const niveles = [
          { nombre: "Nivel 1", exp: num(p.Nivel1_EXP), yen: num(p.Nivel1_Yen) },
          { nombre: "Nivel 2", exp: num(p.Nivel2_EXP), yen: num(p.Nivel2_Yen) },
          { nombre: "Nivel 3", exp: num(p.Nivel3_EXP), yen: num(p.Nivel3_Yen) },
          { nombre: "Nivel 4", exp: num(p.Nivel4_EXP), yen: num(p.Nivel4_Yen) },
          { nombre: "Nivel 5", exp: num(p.Nivel5_EXP), yen: num(p.Nivel5_Yen) }
        ].filter(n => n.exp > 0 || n.yen > 0);

        html += `
        <div class="product">
          <span class="product-category" style="color:${color}">
            <i class="${icono}"></i> ${p.Categoría}
          </span>

          <p-title>${p.Nombre}</p-title>

          <div class="product-description">
            <desc>${p.Descripción || ""}</desc>
            ${p.Notas ? `<notes><b>Notas:</b> ${p.Notas}</notes>` : ""}
          </div>

          <p-price>
            ${precioExp ? `EXP: ${precioExp}<br>` : ""}
            ${precioYen ? `¥: ${precioYen}<br>` : ""}
          </p-price>

          ${niveles.length ? `
            <select class="select-nivel">
              ${niveles.map(n => `
                <option data-exp="${n.exp}" data-yen="${n.yen}">
                  ${n.nombre} – 
                  ${n.exp ? n.exp + " EXP " : ""}
                  ${n.yen ? n.yen + " ¥" : ""}
                </option>
              `).join("")}
            </select>` : ""}

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
    activarBotones();
  }

  /* ==========================
     CARRITO
  ========================== */

  function activarBotones() {

    document.querySelectorAll(".btn-add").forEach(btn => {

      btn.onclick = () => {

        const nombre = btn.dataset.nombre;
        let exp = num(btn.dataset.exp);
        let yen = num(btn.dataset.yen);
        let nivel = "";

        const selector = btn.parentElement.querySelector(".select-nivel");

        if (selector) {
          const op = selector.selectedOptions[0];
          exp = num(op.dataset.exp);
          yen = num(op.dataset.yen);
          nivel = op.textContent.trim();
        }

        const item = carrito.find(i => i.nombre === nombre && i.nivel === nivel);

        if (item) item.cantidad++;
        else carrito.push({ nombre, nivel, exp, yen, cantidad: 1 });

        renderCarrito();
      };
    });
  }

  function renderCarrito() {

    const cont = document.getElementById("carrito");
    if (!cont) return;

    if (!carrito.length) {
      cont.innerHTML = "<i>Carrito vacío</i>";
      return;
    }

    const totalEXP = carrito.reduce((s, p) => s + (p.exp || 0) * p.cantidad, 0);
    const totalYEN = carrito.reduce((s, p) => s + (p.yen || 0) * p.cantidad, 0);

    cont.innerHTML = `
  <div class="carrito-items">
    ${carrito.map((p, i) => `
      <div class="carrito-item" data-index="${i}">
        
        <div class="carrito-item-info">
          <span class="carrito-nombre">
            ${escapeHTML(p.nombre)}
            ${p.nivel ? ` (${p.nivel})` : ""}
          </span>
          <span class="carrito-cantidad">x${p.cantidad}</span>
        </div>

        <div class="carrito-item-precio">
          ${p.exp ? `<span class="precio-exp">${(p.exp * p.cantidad)} EXP</span>` : ""}
          ${p.yen ? `<span class="precio-yen">${(p.yen * p.cantidad)} ¥</span>` : ""}
        </div>

        <button class="btn-remove" data-index="${i}">
          ✖
        </button>

      </div>
    `).join("")}
  </div>

  <div class="carrito-totales">
    <div><b>Total EXP:</b> ${totalEXP}</div>
    <div><b>Total ¥:</b> ${totalYEN}</div>
  </div>
`;

    cont.querySelectorAll(".btn-remove").forEach(b => {
      b.onclick = () => {
        const index = Number(b.dataset.index);
        if (!isNaN(index)) {
          carrito.splice(index, 1);
          renderCarrito();
        }
      };
    });
  }

  /* ==========================
     FINALIZAR COMPRA
  ========================== */

  function activarFinalizar() {

    const btn = document.getElementById("btn-finalizar");
    if (!btn) return; // 🔹 defensiva

    btn.addEventListener("click", () => {

      if (!carrito.length) {
        alert("El carrito está vacío.");
        return;
      }

      let texto = "[b]Compra realizada[/b]\n\n";

      carrito.forEach(p => {
        texto += `• ${p.nombre}`;
        if (p.nivel) texto += ` (${p.nivel})`;
        texto += ` x${p.cantidad}\n`;

        if (p.exp) texto += `  EXP: ${p.exp * p.cantidad}\n`;
        if (p.yen) texto += `  ¥: ${p.yen * p.cantidad}\n`;
        texto += "\n";
      });

      const totalEXP = carrito.reduce((s, p) => s + p.exp * p.cantidad, 0);
      const totalYEN = carrito.reduce((s, p) => s + p.yen * p.cantidad, 0);

      texto += `[b]Total EXP:[/b] ${totalEXP}\n`;
      texto += `[b]Total ¥:[/b] ${totalYEN}`;

      const textarea = document.getElementById("mensaje-post");
      const form = document.getElementById("form-post");

      if (textarea && form) {
        textarea.value = texto;
        form.submit();
      }
    });
  }

  /* ==========================
     PUBLIC API
  ========================== */

  return { init };

})();

document.addEventListener("DOMContentLoaded", () => {
  appTienda.init();
});