const RegistrosApp = (() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbzY6sWauov11c6RQ6H-OTJMd8d7iXh5XDvUbwNpHqfexPzmkCmLNZSxne5ZPUq6gXVz/exec";

const CONFIG_TABS = {
    "pb": {
      // Si no hay nombre ni apellido, queda vacío y se ocultará con el render nuevo
      id: r => `${r["Nombre"] || ""} ${r["Apellido"] || ""}`.trim(),
      content: r => r["PB"] || "", 
      clasificarPor: "Sexo"
    },
    "rango": {
      id: r => `${r["Nombre"] || ""} ${r["Apellido"] || ""}`.trim(),
      // Lógica para que el guion "-" solo aparezca si ambos datos existen
      content: r => {
        const oc = r["Ocupación"];
        const rg = r["Rango"];
        if (oc && rg) return `${oc} - ${rg}`;
        return oc || rg || "";
      },
      clasificarPor: "Rango"
    },
    "don": {
      id: r => `${r["Nombre"] || ""} ${r["Apellido"] || ""} &bull; <em>${r["Apodo"] || ""}</em>`.trim(),
      content: r => r["Don"] || "",
      clasificarPor: "Tipo de Don"
    },
    "personaje": {
      id: r => `${r["Nombre"] || ""} ${r["Apellido"] || ""}`.trim(),
      content: r => `${r["Grupo"] || ""} - ${r["Tipo de Sangre"] || ""} - ${r["Alineación"] || ""}`.trim(),
      clasificarPor: "Grupo"
    }
  };

  let registros = [];
  let filtrosActivos = {};
  let pestañaActiva = "pb";
  let busquedaTexto = "";

  /* --- INICIALIZACIÓN --- */
  function init() {
    activarTabs();
    activarFiltros();

    const contenedor = document.getElementById("contenedor-registros");
    if (contenedor) contenedor.innerHTML = "<p>Cargando datos...</p>";

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        registros = data;
        generarFiltros();
        renderContenido();
      })
      .catch(err => {
        console.error("Error:", err);
        if (contenedor) contenedor.innerHTML = "<p>Error al cargar los datos.</p>";
      });
  }

  /* --- EVENTOS Y TABS --- */
  function activarTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(btn => {
      btn.addEventListener("click", () => {
        tabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        pestañaActiva = btn.dataset.tab;
        renderContenido();
      });
    });
    // Activa visualmente la pestaña por defecto al inicio
    document.querySelector(`.tab-btn[data-tab="${pestañaActiva}"]`)?.classList.add("active");
  }

  /* --- FILTROS --- */
  function generarFiltros() {
    const filtrosConfig = [
      { campo: "Grupo", id: "filtro-grupo" },
      { campo: "Tipo de Don", id: "filtro-don" },
      { campo: "Sexo", id: "filtro-sexo" },
      { campo: "Ocupación", id: "filtro-ocupacion" },
      { campo: "Tipo de Sangre", id: "filtro-sangre" }
    ];

    filtrosConfig.forEach(({ campo, id }) => {
      const cont = document.getElementById(id);
      if (!cont) return;

      const valores = [...new Set(registros.map(r => r[campo]).filter(Boolean))].sort();
      
      cont.innerHTML = `<h4>${campo}</h4>` + valores.map(val => `
        <label style="display: block;">
          <input type="checkbox" data-campo="${campo}" value="${val}"> ${val}
        </label>
      `).join("");
    });
  }

  function activarFiltros() {
    document.addEventListener("change", e => {
      if (e.target.dataset.campo) actualizarFiltros();
    });

    document.getElementById("btn-limpiar-filtros")?.addEventListener("click", () => {
      document.querySelectorAll("#filtros input").forEach(i => i.checked = false);
      filtrosActivos = {};
      renderContenido();
    });

    document.getElementById("busqueda-texto")?.addEventListener("input", e => {
      busquedaTexto = e.target.value.toLowerCase().trim();
      renderContenido();
    });
  }

  function actualizarFiltros() {
    filtrosActivos = {};
    document.querySelectorAll("#filtros input:checked").forEach(chk => {
      const { campo } = chk.dataset;
      if (!filtrosActivos[campo]) filtrosActivos[campo] = [];
      filtrosActivos[campo].push(chk.value);
    });
    renderContenido();
  }

  function aplicarFiltros() {
    return registros.filter(r => {
      const pasaCheck = Object.keys(filtrosActivos).every(campo => 
        filtrosActivos[campo].includes(r[campo])
      );
      const contenidoFila = Object.values(r).join(" ").toLowerCase();
      return pasaCheck && contenidoFila.includes(busquedaTexto);
    });
  }

  /* --- RENDERIZADO --- */
  function generarHtmlCard(r, config) {
    return `
      <div class="record">
          <div class="character-name">${config.id(r)}</div>
         <div class="character-content">${config.content(r)}</div>
      </div>
    `;
  }

  function renderContenido() {
    const contenedor = document.getElementById("contenedor-registros");
    if (!contenedor) return;

    const datos = aplicarFiltros();
    const config = CONFIG_TABS[pestañaActiva];

    if (!datos.length) {
      contenedor.innerHTML = "<p>No se encontraron resultados.</p>";
      return;
    }

    if (config.clasificarPor) {
      const grupos = datos.reduce((acc, r) => {
        const cat = r[config.clasificarPor] || "Otros";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r);
        return acc;
      }, {});

      contenedor.innerHTML = Object.keys(grupos).sort().map(cat => `
        <div class="grupo-categoria">
          <h2 class="titulo-categoria">${cat}</h2>
          <div class="grid-cards">
            ${grupos[cat].map(r => generarHtmlCard(r, config)).join("")}
          </div>
        </div>
      `).join("");
    } else {
      contenedor.innerHTML = `<div class="grid-cards"> ${datos.map(r => generarHtmlCard(r, config)).join("")}</div>`;
    }
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", RegistrosApp.init);