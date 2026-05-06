const appTienda = (function () {

  /* ==========================
     CONFIG Y ESTADO
  ========================== */

  const API_URL = "https://script.google.com/macros/s/AKfycbxGzKTNqDy3s4AfHX_gzkQg3CGfAJ39EIefWev_i1a4x6-AfhpMVjJ6QJDfp5f11qtgMw/exec";

  const ICONOS = {
    "Equipo": "fa-regular fa-uniform-martial-arts", 
    "Armas": "fa-solid fa-gun",
    "Habilidades": "fa-solid fa-hand-fist", 
    "Técnicas": "fa-solid fa-burst",
    "Rasgos": "fa-solid fa-person-burst", 
    "Debilidades": "fa-solid fa-person-falling-burst",
    "Sustancias": "fa-solid fa-flask", 
    "General": "fa-solid fa-gear",
    "Quirk": "fa-solid fa-bolt",
    "Certificaciones": "fa-solid fa-certificate", 
    "Materiales": "fa-solid fa-toolbox",
    "Ingredientes": "fa-brands fa-pagelines"
  };

  const COLORES = {
    "Armaduras": "#2C6FB8", "Armas": "#A1121F", "Habilidades": "#3F7F1E",
    "Técnicas": "#7A1494", "Rasgos": "#B87414", "Debilidades": "#5E0FB8",
    "Accesorios": "#1F8F7A", "General": "#4A4A4A", "Quirk": "#B59B00",
    "Medicina": "#2F5F14", "Estimulantes": "#5C8F3A", "Experimentales": "#4B1F63",
    "Certificaciones": "#8F4A1F", "Materiales": "#3A3A3A", "Ingredientes": "#1F4A1F"
  };

  let productos = [];
  let carrito = [];
  let categoriaActual = "";
  
  // ESTADO DE FILTROS
  let filtroTexto = "";
  let costesActivos = [];
  let tiposActivos = [];

  const num = v => Number(v) || 0;
  const fmt = v => new Intl.NumberFormat('de-DE').format(num(v));
  
  function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ==========================
     SISTEMA DE FILTROS
  ========================== */

  function inicializarFiltros() {
    const inputBusqueda = document.getElementById("filtro-texto");
    if (inputBusqueda) {
      inputBusqueda.addEventListener("input", e => {
        filtroTexto = e.target.value.toLowerCase();
        renderTienda();
      });
    }

    document.addEventListener("change", e => {
      if (e.target.matches("#filtro-costes input") || e.target.matches("#filtro-tipos input")) {
        costesActivos = [...document.querySelectorAll("#filtro-costes input:checked")].map(i => i.value);
        tiposActivos = [...document.querySelectorAll("#filtro-tipos input:checked")].map(i => i.value);
        renderTienda();
      }
    });
  }

  function renderFiltroTipos() {
    const contTipos = document.getElementById("filtro-tipos");
    if (!contTipos) return;

    const productosDeCategoria = productos.filter(p => p.Categoría === categoriaActual);
    const tiposUnicos = [...new Set(productosDeCategoria.map(p => p.Tipo).filter(Boolean))];

    if (tiposUnicos.length === 0) {
      contTipos.innerHTML = `<i>No hay subtipos</i>`;
      return;
    }

    contTipos.innerHTML = tiposUnicos.map(tipo => `
      <label>
        <input type="checkbox" value="${escapeHTML(tipo)}"> ${escapeHTML(tipo)}
      </label>
    `).join("");
  }

  function aplicarFiltros() {
    return productos.filter(p => {
      if (p.Categoría !== categoriaActual) return false;

      const nombreSeguro = (p.Nombre || "").toLowerCase();
      if (filtroTexto && !nombreSeguro.includes(filtroTexto)) return false;

      if (tiposActivos.length && !tiposActivos.includes(p.Tipo)) return false;

      if (costesActivos.length) {
        const tieneEXP = num(p.PrecioEXP) > 0 || [p.Nivel1_EXP, p.Nivel2_EXP, p.Nivel3_EXP, p.Nivel4_EXP, p.Nivel5_EXP].some(v => num(v) > 0);
        const tieneYEN = num(p.PrecioYenes) > 0 || [p.Nivel1_Yen, p.Nivel2_Yen, p.Nivel3_Yen, p.Nivel4_Yen, p.Nivel5_Yen].some(v => num(v) > 0);

        if (costesActivos.includes("EXP") && tieneEXP) return true;
        if (costesActivos.includes("YEN") && tieneYEN) return true;
        
        return false;
      }

      return true;
    });
  }

  /* ==========================
     SISTEMA DE PESTAÑAS
  ========================== */

  function renderPestañas(categorias) {
    const contenedor = document.getElementById("tienda-tabs");
    if (!contenedor) return;

    if (!categoriaActual) categoriaActual = categorias[0];

    contenedor.innerHTML = categorias.map(cat => `
      <button class="tab-btn ${cat === categoriaActual ? 'active' : ''}" data-cat="${cat}">
        <i class="${ICONOS[cat] || 'fa-solid fa-tags'}"></i> ${cat}
      </button>
    `).join("");

    contenedor.querySelectorAll(".tab-btn").forEach(btn => {
      btn.onclick = () => {
        categoriaActual = btn.dataset.cat;
        tiposActivos = []; 
        renderPestañas(categorias);
        renderFiltroTipos(); 
        renderTienda();
      };
    });
  }

  /* ==========================
     RENDER TIENDA
  ========================== */

  function renderTienda() {
    const contenedor = document.getElementById("tienda");
    if (!contenedor) return;

    const listaFiltrada = aplicarFiltros();
    let html = `<div class="product-list">`;

    if (listaFiltrada.length === 0) {
      html += `<p style="width: 100%; text-align: center; padding: 20px;">No se encontraron resultados con estos filtros.</p>`;
    }

    listaFiltrada.forEach(p => {
      const niveles = [
        { n: "Nivel 1", e: num(p.Nivel1_EXP), y: num(p.Nivel1_Yen) },
        { n: "Nivel 2", e: num(p.Nivel2_EXP), y: num(p.Nivel2_Yen) },
        { n: "Nivel 3", e: num(p.Nivel3_EXP), y: num(p.Nivel3_Yen) },
        { n: "Nivel 4", e: num(p.Nivel4_EXP), y: num(p.Nivel4_Yen) },
        { n: "Nivel 5", e: num(p.Nivel5_EXP), y: num(p.Nivel5_Yen) }
      ].filter(n => n.e > 0 || n.y > 0);

      html += `
        <div class="product" style="border-top: 3px solid ${COLORES[p.Categoría] || '#666'}">
          <p-title>${escapeHTML(p.Nombre)}</p-title>
          <div class="product-description">
            ${p.Tipo ? `<div class="p-tipo"><b>Tipo:</b> ${escapeHTML(p.Tipo)}</div>` : ""}
            <desc>${p.Descripción || ""}</desc>
            ${p.Notas ? `<notes><b>Notas:</b> ${p.Notas}</notes>` : ""}
          </div>
          <p-price>
            ${num(p.PrecioEXP) ? `EXP: ${fmt(p.PrecioEXP)}<br>` : ""}
            ${num(p.PrecioYenes) ? `¥: ${fmt(p.PrecioYenes)}<br>` : ""}
          </p-price>
          ${niveles.length ? `
            <select class="select-nivel">
              ${niveles.map(n => `<option data-exp="${n.e}" data-yen="${n.y}">${n.n} – ${n.e ? fmt(n.e)+' EXP ' : ''}${n.y ? fmt(n.y)+' ¥' : ''}</option>`).join("")}
            </select>` : ""}
          <button class="btn-add" data-nombre="${escapeHTML(p.Nombre)}" data-exp="${num(p.PrecioEXP)}" data-yen="${num(p.PrecioYenes)}" data-categoria="${p.Categoría}">
            Agregar al carrito
          </button>
        </div>`;
    });

    html += "</div>";
    contenedor.innerHTML = html;
  }

  /* ==========================
     CARRITO Y FINALIZAR
  ========================== */

  function inicializarEventosCarrito() {
    document.addEventListener("click", e => {
      if (e.target.classList.contains("btn-add")) {
        const btn = e.target;
        let exp = num(btn.dataset.exp), yen = num(btn.dataset.yen), nivel = "", categoria = btn.dataset.categoria;
        const selector = btn.parentElement.querySelector(".select-nivel");
        
        if (selector) {
          const op = selector.selectedOptions[0];
          exp = num(op.dataset.exp); yen = num(op.dataset.yen);
          nivel = op.textContent.split("–")[0].trim();
        }

        const item = carrito.find(i => i.nombre === btn.dataset.nombre && i.nivel === nivel);
        if (item) item.cantidad++;
        else carrito.push({ nombre: btn.dataset.nombre, nivel, exp, yen, cantidad: 1, categoria });

        renderCarrito();
      }
    });
  }

  function renderCarrito() {
    const cont = document.getElementById("carrito");
    if (!cont) return;

    if (!carrito.length) { 
        cont.innerHTML = "<i>Carrito vacío</i>"; 
        return; 
    }

    // Separamos Gastos de Ganancias
    const tEXP = carrito.reduce((s, p) => p.categoria !== "Debilidades" ? s + (p.exp * p.cantidad) : s, 0);
    const gEXP = carrito.reduce((s, p) => p.categoria === "Debilidades" ? s + (p.exp * p.cantidad) : s, 0);
    const tYEN = carrito.reduce((s, p) => s + (p.yen * p.cantidad), 0);

    cont.innerHTML = `
      <div class="carrito-items">
        ${carrito.map((p, i) => `
          <div class="carrito-item">
            <span>${p.nombre} ${p.nivel ? `(${p.nivel})` : ""} x${p.cantidad}</span>
            <button class="btn-remove" data-index="${i}">✖</button>
          </div>`).join("")}
      </div>
      <div class="carrito-totales">
        Total Gasto: ${fmt(tEXP)} EXP | ${fmt(tYEN)} ¥
        ${gEXP > 0 ? `<br><strong style="color: #3F7F1E;">Total Ganancia: +${fmt(gEXP)} EXP</strong>` : ""}
      </div>`;

    cont.querySelectorAll(".btn-remove").forEach(b => {
      b.onclick = () => { carrito.splice(Number(b.dataset.index), 1); renderCarrito(); };
    });
  }

  function activarFinalizar() {
    document.getElementById("btn-finalizar")?.addEventListener("click", () => {
      if (!carrito.length) return alert("El carrito está vacío.");
      
      let texto = "COMPRA REALIZADA\n\n";
      
      carrito.forEach(p => {
        texto += `• ${p.nombre} ${p.nivel ? `(${p.nivel})` : ""} x${p.cantidad}\n`;
        
        // Formateo especial si es una debilidad
        if (p.categoria === "Debilidades") {
          if (p.exp) texto += `  GANANCIA: +${fmt(p.exp * p.cantidad)} EXP\n\n`;
        } else {
          if (p.exp) texto += `  COSTO: ${fmt(p.exp * p.cantidad)} EXP\n`;
          if (p.yen) texto += `  COSTO: ${fmt(p.yen * p.cantidad)} ¥\n\n`;
        }
      });

      // Cálculos separados para posteo
      const tEXP = carrito.reduce((s, p) => p.categoria !== "Debilidades" ? s + (p.exp * p.cantidad) : s, 0);
      const gEXP = carrito.reduce((s, p) => p.categoria === "Debilidades" ? s + (p.exp * p.cantidad) : s, 0);
      const tYEN = carrito.reduce((s, p) => s + (p.yen * p.cantidad), 0);
      
      texto += `TOTAL GASTO: ${fmt(tEXP)} EXP | ${fmt(tYEN)} YEN`;
      if (gEXP > 0) texto += `\nTOTAL GANANCIA: +${fmt(gEXP)} EXP`;

      const textarea = document.getElementById("mensaje-post");
      if (textarea) { 
        textarea.value = texto; 
        document.getElementById("form-post")?.submit(); 
      }
    });
  }

  return {
    init: async function() {
      if (!document.getElementById("tienda")) return;
      const rawData = await fetch(API_URL).then(r => r.json());
      
      // Filtro de Disponibilidad principal
      productos = rawData.filter(p => p.Disponible === true || String(p.Disponible).toLowerCase() === "true");

      const categorias = [...new Set(productos.map(p => p.Categoría))];
      
      inicializarFiltros(); 
      renderPestañas(categorias);
      renderFiltroTipos(); 
      renderTienda();
      inicializarEventosCarrito();
      activarFinalizar();
    }
  };
})();

document.addEventListener("DOMContentLoaded", () => appTienda.init());