
  const appEmpleos = (function () {
  /* ==========================
     CONFIGURACIÓN Y ESTADO
  ========================== */
  const API_URL = "https://script.google.com/macros/s/AKfycbxqp7eDb4zoJ4cCNWqsVQ6ZGVdaU2mL2rSCH0-scYs15P08k0HGlWuVMTlfFMvbGyAzYw/exec";  
  
  let empleos = [];
  let institucionActual = "";
  let filtroBusqueda = ""; // 🔹 Nueva variable para el texto de búsqueda
  
  const num = v => Number(v) || 0;
  const fmt = v => new Intl.NumberFormat('de-DE').format(num(v));
  
  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ==========================
     SISTEMA DE PESTAÑAS
  ========================== */
  function renderPestañas(instituciones) {
    const contenedor = document.getElementById("empleos-tabs");
    if (!contenedor) return;

    if (!institucionActual) institucionActual = instituciones[0];

    contenedor.innerHTML = instituciones.map(inst => `
      <button class="tab-btn ${inst === institucionActual ? 'activo' : ''}" data-inst="${escapeHTML(inst)}">
        ${escapeHTML(inst)}
      </button>
    `).join("");

    contenedor.querySelectorAll(".tab-btn").forEach(btn => {
      btn.onclick = () => {
        institucionActual = btn.dataset.inst;
        // Limpiamos el buscador al cambiar de pestaña para evitar confusiones
        filtroBusqueda = ""; 
        const inputBuscador = document.getElementById("busqueda-empleos");
        if (inputBuscador) inputBuscador.value = "";
        
        renderPestañas(instituciones);
        renderEmpleos();
      };
    });
  }

  /* ==========================
     BUSCADOR ARROBA
  ========================== */
  function inicializarBuscador() {
    const input = document.getElementById("busqueda-empleos");
    if (input) {
      input.addEventListener("input", (e) => {
        filtroBusqueda = e.target.value.toLowerCase().trim();
        renderEmpleos();
      });
    }
  }

  /* ==========================
     RENDER DE EMPLEOS
  ========================== */
  function renderEmpleos() {
    const contenedor = document.getElementById("lista-empleos");
    if (!contenedor) return;

    // 1. Filtramos por la pestaña actual
    let lista = empleos.filter(e => e.Institución === institucionActual);

    // 2. 🔹 Aplicamos la lógica de búsqueda
    if (filtroBusqueda) {
      lista = lista.filter(e => {
        const nombreSeguro = (e.Nombre || "").toLowerCase();
        const areaSegura = (e.Área || "").toLowerCase();
        const ocupanteSeguro = (e.Ocupante || "").toLowerCase();

        // Si la búsqueda inicia con "@", buscamos SÓLO en Ocupantes
        if (filtroBusqueda.startsWith("@")) {
          const arrobaBusqueda = filtroBusqueda.substring(1); // Quitamos el @
          return ocupanteSeguro.includes(arrobaBusqueda);
        }

        // Si es texto normal, buscamos en Nombre de Puesto, Área u Ocupante
        return nombreSeguro.includes(filtroBusqueda) || 
               areaSegura.includes(filtroBusqueda) || 
               ocupanteSeguro.includes(filtroBusqueda);
      });
    }

    let html = "";

    if (lista.length === 0) {
      html = `<p style="text-align:center; padding: 20px; color:#666;">No se encontraron empleos que coincidan con la búsqueda.</p>`;
    } else {
      lista.forEach(e => {
        const sueldoYen = num(e.YENS);
        const sueldoExp = num(e.EXP);
        const vacantesTotales = num(e.Vacantes);
        const vacantesOcupadas = num(e['Vacantes Ocupadas']);
        const vacantesDisponibles = vacantesTotales - vacantesOcupadas;
        
        const estadoVacantes = vacantesDisponibles > 0 
          ? `<span class="badge-abierto">${vacantesDisponibles} Disponible(s)</span>` 
          : `<span class="badge-cerrado">Cupo Lleno</span>`;

        html += `
          <div class="empleo-card">
            <div class="empleo-header">
              <h3>${escapeHTML(e.Nombre)}</h3>
              ${estadoVacantes}
            </div>
            
            <div class="empleo-meta">
              <span><strong>Área:</strong> ${escapeHTML(e.Área)}</span>
              <span><strong>Riesgo:</strong> ${escapeHTML(e.Riesgo)}</span>
            </div>

            <p class="empleo-desc">${escapeHTML(e.Descripción)}</p>

            <div class="empleo-requisitos">
              <strong>Requisitos:</strong> ${escapeHTML(e.Certificaciones)} <br>
              <strong>Edad Mínima:</strong> ${escapeHTML(e['Edad Mínima'])} años
            </div>

            <div class="empleo-economia">
              <div class="sueldos">
                ${sueldoYen ? `<span><strong>Sueldo:</strong> ¥${fmt(sueldoYen)}</span>` : ""}
                ${sueldoExp ? `<span><strong>EXP:</strong> ${fmt(sueldoExp)}</span>` : ""}
              </div>
              <div class="cobro-info">
                <em>Mínimo de posts para cobro: ${num(e.Cobro)}</em>
              </div>
            </div>

            ${e.Ocupante ? `<div class="empleo-ocupante"><strong>Ocupante actual:</strong> ${escapeHTML(e.Ocupante)}</div>` : ""}
          </div>
        `;
      });
    }

    contenedor.innerHTML = html;
  }

  /* ==========================
     INICIALIZACIÓN
  ========================== */
  return {
    init: async function() {
      if (!document.getElementById("lista-empleos")) return;
      
      try {
        empleos = await fetch(API_URL).then(r => r.json());
        empleos = empleos.filter(e => e.Institución && e.Nombre);
        
        const instituciones = [...new Set(empleos.map(e => e.Institución))];
        renderPestañas(instituciones);
        inicializarBuscador(); // 🔹 Arrancamos el event listener del buscador
        renderEmpleos();
      } catch (error) {
        console.error("Error cargando los empleos:", error);
        document.getElementById("lista-empleos").innerHTML = "<p>Error al cargar el tablón de empleos.</p>";
      }
    }
  };
})();

document.addEventListener("DOMContentLoaded", () => appEmpleos.init());