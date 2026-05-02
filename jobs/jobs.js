const appEmpleos = (function () {
  /* ==========================
     CONFIGURACIÓN Y ESTADO
  ========================== */
  // ⚠️ REEMPLAZA ESTA URL CON LA DE TU NUEVA APP SCRIPT DE EMPLEOS
  const API_URL = "https://script.google.com/macros/s/AKfycbxqp7eDb4zoJ4cCNWqsVQ6ZGVdaU2mL2rSCH0-scYs15P08k0HGlWuVMTlfFMvbGyAzYw/exec"; 
  
  let empleos = [];
  let institucionActual = "";
  
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
        renderPestañas(instituciones);
        renderEmpleos();
      };
    });
  }

  /* ==========================
     RENDER DE EMPLEOS
  ========================== */
  function renderEmpleos() {
    const contenedor = document.getElementById("lista-empleos");
    if (!contenedor) return;

    const lista = empleos.filter(e => e.Institución === institucionActual);
    let html = "";

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

    contenedor.innerHTML = html;
  }

 /* ==========================
     INICIALIZACIÓN Y DEBUG
  ========================== */
  return {
    init: async function() {
      if (!document.getElementById("lista-empleos")) return;
      
      try {
        const rawData = await fetch(API_URL).then(r => r.json());
        console.log("🕵️ DATOS CRUDOS DE LA API:", rawData); // <- Esto nos dirá la verdad
        
        empleos = rawData.filter(e => e.Institución && e.Nombre);
        console.log("✅ DATOS DESPUÉS DEL FILTRO:", empleos);
        
        if (empleos.length === 0) {
          document.getElementById("lista-empleos").innerHTML = "<p>No hay empleos válidos. Revisa la consola (F12).</p>";
          return;
        }

        const instituciones = [...new Set(empleos.map(e => e.Institución))];
        renderPestañas(instituciones);
        renderEmpleos();
      } catch (error) {
        console.error("Error cargando los empleos:", error);
      }
    }
  };
})();

document.addEventListener("DOMContentLoaded", () => appEmpleos.init());