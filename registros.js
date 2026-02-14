const RegistrosApp = (() => {

  /* =====================================
     CONFIGURACIÓN
  ===================================== */
  const API_URL = "https://script.google.com/macros/s/AKfycbzY6sWauov11c6RQ6H-OTJMd8d7iXh5XDvUbwNpHqfexPzmkCmLNZSxne5ZPUq6gXVz/exec";

  /* =====================================
     ESTADO PRIVADO
  ===================================== */
  let registros = [];
  let filtrosActivos = {};
  let sortColumn = "";
  let sortAsc = true;

  /* =====================================
     INICIALIZACIÓN
  ===================================== */
  function init() {

    // Seguridad: solo ejecutar si existe la tabla
    if (!document.getElementById("tabla-registros")) return;

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        registros = data;
        generarFiltros();
        renderTabla(registros);
      })
      .catch(err => console.error("Error:", err));

    activarEventos();
  }

  /* =====================================
     GENERAR FILTROS
  ===================================== */
  function generarFiltros() {
    crearGrupoCheckbox("Grupo", "filtro-grupo");
    crearGrupoCheckbox("Tipo de Don", "filtro-don");
    crearGrupoCheckbox("Sexo", "filtro-sexo");
  }

  function crearGrupoCheckbox(campo, contenedorId) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    const valores = [...new Set(
      registros.map(r => r[campo]).filter(v => v)
    )].sort();

    cont.innerHTML = "";

    valores.forEach(val => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" data-campo="${campo}" value="${val}">
        ${val}
      `;
      cont.appendChild(label);
      cont.appendChild(document.createElement("br"));
    });
  }

  /* =====================================
     EVENTOS
  ===================================== */
  function activarEventos() {

    document.addEventListener("change", e => {
      if (!e.target.matches("#filtro-grupo input, #filtro-don input, #filtro-sexo input")) return;

      filtrosActivos = {};

      document.querySelectorAll(
        "#filtro-grupo input:checked, #filtro-don input:checked, #filtro-sexo input:checked"
      ).forEach(chk => {
        const campo = chk.dataset.campo;
        if (!filtrosActivos[campo]) filtrosActivos[campo] = [];
        filtrosActivos[campo].push(chk.value);
      });

      renderTabla(aplicarFiltros());
    });

  }

  /* =====================================
     APLICAR FILTROS
  ===================================== */
  function aplicarFiltros() {
    return registros.filter(r => {
      return Object.keys(filtrosActivos).every(campo =>
        filtrosActivos[campo].includes(r[campo])
      );
    });
  }

  /* =====================================
     RENDER TABLA
  ===================================== */
  function renderTabla(lista) {

    let datos = [...lista];

    if (sortColumn) {
      datos.sort((a, b) => {
        let A = (a[sortColumn] || "").toLowerCase();
        let B = (b[sortColumn] || "").toLowerCase();
        return (A < B ? -1 : A > B ? 1 : 0) * (sortAsc ? 1 : -1);
      });
    }

    const tbody = document.querySelector("#tabla-registros tbody");
    if (!tbody) return;

    let html = "";

    datos.forEach(r => {
      html += `
        <tr>
          <td>${r["Nombre"] || ""}</td>
          <td>${r["Apellido"] || ""}</td>
          <td>${r["Grupo"] || ""}</td>
          <td>${r["Tipo de Don"] || ""}</td>
          <td>${r["Alineación"] || ""}</td>
          <td>${r["Tipo de Sangre"] || ""}</td>
          <td>${r["Apodo"] || ""}</td>
          <td>${r["Sexo"] || ""}</td>
          <td>${r["PB"] || ""}</td>
          <td>${r["Ocupación"] || ""}</td>
          <td>${r["Rango"] || ""}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  /* =====================================
     ORDENAR (expuesto solo si se necesita)
  ===================================== */
  function ordenar(col) {
    if (sortColumn === col) {
      sortAsc = !sortAsc;
    } else {
      sortColumn = col;
      sortAsc = true;
    }
    renderTabla(aplicarFiltros());
  }

  /* =====================================
     API PÚBLICA
  ===================================== */
  return {
    init,
    ordenar
  };

})();

/* =====================================
   INICIAR AUTOMÁTICAMENTE
===================================== */
document.addEventListener("DOMContentLoaded", () => {
  RegistrosApp.init();
});