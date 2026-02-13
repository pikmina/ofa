const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQm9H974C5O1TPyBm4CFM7Iu2_OVDyE4b2ndHeduqxWwFldHVuPpuZ1lii09WCgRs0QpIKF82mRp8sd/pub?gid=1538740590&single=true&output=csv";

let registros = [];
let sortColumn = "";
let sortAsc = true;

document.addEventListener("DOMContentLoaded", cargarCSV);

// ----------------------
// Cargar CSV
// ----------------------
function cargarCSV() {
  fetch(CSV_URL)
    .then(r => r.text())
    .then(text => {
      registros = parseCSV(text);
      generarFiltros();
      mostrarTabla();
    })
    .catch(err => {
      console.error("Error cargando CSV:", err);
    });
}

// ----------------------
// Parser CSV robusto (sin librerías)
// ----------------------
function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const lines = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"' && text[i + 1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  lines.push(current);

  const headers = lines[0].split(",").map(h => h.trim());

  for (let i = 1; i < lines.length; i++) {
    const cols = [];
    let field = '';
    let quoted = false;

    for (let j = 0; j < lines[i].length; j++) {
      const c = lines[i][j];

      if (c === '"' && lines[i][j + 1] === '"') {
        field += '"';
        j++;
      } else if (c === '"') {
        quoted = !quoted;
      } else if (c === ',' && !quoted) {
        cols.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    cols.push(field.trim());

    if (cols.length >= headers.length) {
      let obj = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] || "";
      });
      rows.push(obj);
    }
  }

  return rows;
}

// ----------------------
// Generar filtros
// ----------------------
function generarFiltros() {
  generarCheckbox("Grupo", "filtro-grupo");
  generarCheckbox("Tipo de Don", "filtro-don");
  generarCheckbox("Sexo", "filtro-sexo");
}

function generarCheckbox(campo, contenedorId) {
  const valores = [...new Set(registros.map(r => r[campo]).filter(v => v))];
  const cont = document.getElementById(contenedorId);
  cont.innerHTML = "";

  valores.sort().forEach(val => {
    cont.innerHTML += `
      <label>
        <input type="checkbox" class="chk" data-campo="${campo}" value="${val}">
        ${val}
      </label><br>
    `;
  });

  cont.querySelectorAll(".chk").forEach(chk =>
    chk.addEventListener("change", mostrarTabla)
  );
}

// ----------------------
// Mostrar tabla
// ----------------------
function mostrarTabla() {

  let filtrados = registros.filter(r => {

    const filtrosPorCampo = {};

    document.querySelectorAll(".chk:checked").forEach(chk => {
      const campo = chk.dataset.campo;
      if (!filtrosPorCampo[campo]) filtrosPorCampo[campo] = [];
      filtrosPorCampo[campo].push(chk.value);
    });

    return Object.keys(filtrosPorCampo).every(campo =>
      filtrosPorCampo[campo].includes(r[campo])
    );
  });

  if (sortColumn) {
    filtrados.sort((a, b) => {
      let A = (a[sortColumn] || "").toLowerCase();
      let B = (b[sortColumn] || "").toLowerCase();
      return (A < B ? -1 : A > B ? 1 : 0) * (sortAsc ? 1 : -1);
    });
  }

  const tbody = document.querySelector("#tabla-registros tbody");
  let html = "";

  filtrados.forEach(r => {
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
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ----------------------
// Ordenar
// ----------------------
function ordenar(col) {
  if (sortColumn === col) {
    sortAsc = !sortAsc;
  } else {
    sortColumn = col;
    sortAsc = true;
  }
  mostrarTabla();
}