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
  "General": "fa-solid fa-gear",
  "Quirk": "fa-solid fa-bolt",
  "Medicina": "fa-solid fa-pills",
  "Estimulantes": "fa-solid fa-flask",
  "Experimentales": "fa-solid fa-flask-vial"
};

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("tienda")) return;

  const productos = await fetch(API_URL).then(r => r.json());

  /* ==========================
      FILTROS (estado)
     ========================== */
  let filtroTexto = "";
  let filtroCategoria = "Todas";
  let filtroCoste = "Todos";

  /* ==========================
      INICIALIZAR FILTROS
     ========================== */
  const selectCategoria = document.getElementById("filtro-categoria");
  const categorias = ["Todas", ...new Set(productos.map(p => p.Categoría))];

  categorias.forEach(c => {
    const opt = document.createElement("option");
    opt.textContent = c;
    selectCategoria.appendChild(opt);
  });

  document.getElementById("filtro-texto").addEventListener("input", e => {
    filtroTexto = e.target.value.toLowerCase();
    renderTienda(aplicarFiltros());
  });

  selectCategoria.addEventListener("change", e => {
    filtroCategoria = e.target.value;
    renderTienda(aplicarFiltros());
  });

  document.getElementById("filtro-coste").addEventListener("change", e => {
    filtroCoste = e.target.value;
    renderTienda(aplicarFiltros());
  });

  /* ==========================
      APLICAR FILTROS
     ========================== */
  function aplicarFiltros() {
    return productos.filter(p => {

      if (filtroTexto && !p.Nombre.toLowerCase().includes(filtroTexto)) {
        return false;
      }

      if (filtroCategoria !== "Todas" && p.Categoría !== filtroCategoria) {
        return false;
      }

      const tieneEXP = Number(p.PrecioEXP) > 0 ||
        [p.Nivel1_EXP, p.Nivel2_EXP, p.Nivel3_EXP, p.Nivel4_EXP, p.Nivel5_EXP]
          .some(v => Number(v) > 0);

      const tieneYEN = Number(p.PrecioYenes) > 0 ||
        [p.Nivel1_Yen, p.Nivel2_Yen, p.Nivel3_Yen, p.Nivel4_Yen, p.Nivel5_Yen]
          .some(v => Number(v) > 0);

      if (filtroCoste === "EXP" && !tieneEXP) return false;
      if (filtroCoste === "YEN" && !tieneYEN) return false;

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

        const precioExp = Number(p.PrecioEXP) || 0;
        const precioYen = Number(p.PrecioYenes) || 0;
        const icono = ICONOS[p.Categoría] || "fa-solid fa-box-open";

        const niveles = [
          { nombre: "Nivel 1", exp: p.Nivel1_EXP, yen: p.Nivel1_Yen },
          { nombre: "Nivel 2", exp: p.Nivel2_EXP, yen: p.Nivel2_Yen },
          { nombre: "Nivel 3", exp: p.Nivel3_EXP, yen: p.Nivel3_Yen },
          { nombre: "Nivel 4", exp: p.Nivel4_EXP, yen: p.Nivel4_Yen },
          { nombre: "Nivel 5", exp: p.Nivel5_EXP, yen: p.Nivel5_Yen }
        ].filter(n => Number(n.exp) > 0 || Number(n.yen) > 0);

        html += `
        <div class="product">
        <span class="product-category"> <i class="${icono} fa-3x producto-icon"></i> ${p.Categoría}</span>
          <p-title>${p.Nombre}</p-title>
          <small>${p.Descripción}</small>

          <p-price>
            ${precioExp > 0 ? `EXP: ${precioExp}<br>` : ""}
            ${precioYen > 0 ? `¥: ${precioYen}<br>` : ""}
          </p-price>
          

          ${niveles.length ? `
            <select class="select-nivel">
              ${niveles.map(n => `
                <option data-exp="${n.exp || 0}" data-yen="${n.yen || 0}">
                  ${n.nombre} – ${n.exp ? n.exp + " EXP " : ""}${n.yen ? n.yen + " ¥" : ""}
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
  let carrito = [];

  function activarBotones() {
    document.querySelectorAll(".btn-add").forEach(btn => {
      btn.onclick = () => {
        const nombre = btn.dataset.nombre;
        let exp = Number(btn.dataset.exp);
        let yen = Number(btn.dataset.yen);
        let nivel = "";

        const selector = btn.parentElement.querySelector(".select-nivel");
        if (selector) {
          const op = selector.selectedOptions[0];
          exp = Number(op.dataset.exp);
          yen = Number(op.dataset.yen);
          nivel = op.textContent.trim();
        }

        let item = carrito.find(i => i.nombre === nombre && i.nivel === nivel);
        if (item) item.cantidad++;
        else carrito.push({ nombre, nivel, exp, yen, cantidad: 1 });

        renderCarrito();
      };
    });
  }

  function renderCarrito() {
    if (!carrito.length) {
      document.getElementById("carrito").innerHTML = "<i>Carrito vacío</i>";
      return;
    }

    const totalEXP = carrito.reduce((s, p) => s + p.exp * p.cantidad, 0);
    const totalYEN = carrito.reduce((s, p) => s + p.yen * p.cantidad, 0);

    document.getElementById("carrito").innerHTML =
      carrito.map((p, i) =>
        `• ${p.nombre}${p.nivel ? " (" + p.nivel + ")" : ""} x${p.cantidad} – 
        ${(p.exp * p.cantidad) || ""} ${(p.yen * p.cantidad) || ""} 
        <button class="btn-remove" data-index="${i}">✖</button>`
      ).join("<br>") +
      `<br><br><b>Total EXP:</b> ${totalEXP}<br><b>Total ¥:</b> ${totalYEN}`;

    document.querySelectorAll(".btn-remove").forEach(b => {
      b.onclick = () => {
        carrito.splice(Number(b.dataset.index), 1);
        renderCarrito();
      };
    });
  }

  renderTienda(productos);
});