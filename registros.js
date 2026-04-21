const RegistrosApp = (() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbyXfrbIr4djZbcju3Pn3Oh3SqGys3e5lQQEGOrn2QWCNGnO4BeUpGv-t5sCe-QOTAtj/exec";

  const CONFIG_TABS = {
    "pb": {
      id: r => `${r["Nombre"] || ""} ${r["Apellido"] || ""}`.trim(),
      content: r => r["PB"] || "", 
      clasificarPor: "Sexo"
    },
    "rango": {
      id: r => `${r["Nombre"] || ""} ${r["Apellido"] || ""}`.trim(),
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
    },
    "canons": {
      id: r => `${r["CNombre"] || ""}`.trim(),
      content: r => {
        const d = r["CDon"] ? `<strong>Don:</strong> ${r["CDon"]}` : "";
        const e = r["CEdad"] ? ` &bull; ${r["CEdad"]} años` : "";
        const o = r["COcupacion"] ? `<br>${r["COcupacion"]}` : "";
        const st = r["CEstado"] ? ` &bull; <em>${r["CEstado"]}</em>` : "";
        return `${d}${e}${o}${st}`;
      },
      clasificarPor: "CGrupo"
    }
  };

  let filtrosActivos = {};
  let pestañaActiva = "canons";
  let busquedaTexto = "";

  /* --- INICIALIZACIÓN --- */
let datosOriginales = { registros: [], canons: [] }; 

function init() {
  activarTabs();
  activarFiltros();

  const contenedor = document.getElementById("contenedor-registros");
  if (contenedor) contenedor.innerHTML = "<p>Cargando datos...</p>";

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      // Validamos que data tenga las propiedades necesarias
      if (data && data.registros && data.canons) {
        datosOriginales = data;
      } else {
        // Si el script devolvió una lista plana en vez de un objeto
        console.error("Formato de datos inesperado:", data);
        datosOriginales = { 
          registros: Array.isArray(data) ? data : [], 
          canons: [] 
        };
      }
      generarFiltros();
      renderContenido();
    })
    .catch(err => {
      console.error("Error en Fetch:", err);
      if (contenedor) contenedor.innerHTML = "<p>Error al conectar con la API.</p>";
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
    document.querySelector(`.tab-btn[data-tab="${pestañaActiva}"]`)?.classList.add("active");
  }

  /* --- FILTROS --- */
 function generarFiltros() {
  // Usamos || [] para asegurar que si algo falla, intente unir listas vacías y no rompa
  const listaR = Array.isArray(datosOriginales.registros) ? datosOriginales.registros : [];
  const listaC = Array.isArray(datosOriginales.canons) ? datosOriginales.canons : [];
  
  const todosLosDatos = [...listaR, ...listaC];
  
  if (todosLosDatos.length === 0) return; // No hay datos para filtrar aún

  const filtrosConfig = [
    { campo: "Grupo", id: "filtro-grupo" },
    { campo: "Tipo de Don", id: "filtro-don" },
    { campo: "Sexo", id: "filtro-sexo" },
    { campo: "Tipo de Sangre", id: "filtro-sangre" },
    { campo: "Estado", id: "filtro-estado" }
  ];

  filtrosConfig.forEach(({ campo, id }) => {
    const cont = document.getElementById(id);
    if (!cont) return;

    const valores = [...new Set(todosLosDatos.map(r => r[campo]).filter(Boolean))].sort();
    
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
    // Seleccionamos la fuente de datos según la pestaña activa
    const listaAEvaluar = (pestañaActiva === "canons") 
      ? datosOriginales.canons 
      : datosOriginales.registros;

    if (!listaAEvaluar) return [];

    return listaAEvaluar.filter(r => {
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
      contenedor.innerHTML = `<div class="grid-cards">${datos.map(r => generarHtmlCard(r, config)).join("")}</div>`;
    }
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", RegistrosApp.init);