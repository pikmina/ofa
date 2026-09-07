jQuery(document).ready(function($) {
    if ($(".mha-ranking-wrapper").length === 0) return;

    // Enlace a tu Google Sheet publicado como CSV
    var urlExcelRangos = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_K1Xk7MDNcyCVV9jO1zwI9pIGaSPcxCwy-3f7J1kH2uDdn7m0TkceDwjOMKwYt7XL-KAUVRTalB5m/pub?gid=904106613&single=true&output=csv";

    // Analizador CSV robusto para proteger comas internas
    function parseCSVRow(str) {
        var result = [], current = "", inQuotes = false;
        for (var i = 0; i < str.length; i++) {
            var char = str[i];
            if (char === '"') {
                if (inQuotes && str[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
                result.push(current); current = "";
            } else { current += char; }
        }
        result.push(current); return result;
    }

    // Calculadora automática de Rango
    function calcularRango(puntos) {
        if (puntos >= 100000) return "S";
        if (puntos >= 50000) return "A";
        if (puntos >= 10000) return "B";
        if (puntos >= 1000) return "C";
        return "D";
    }

    $.ajax({
        url: urlExcelRangos,
        type: "GET",
        dataType: "text",
        success: function (data) {
            var lineas = data.split(/\r?\n/);
            var personajes = [];

            // Empezamos en 1 para saltar las cabeceras (Nombre, Fama)
            for (var j = 1; j < lineas.length; j++) {
                if (!lineas[j]) continue;
                var cols = parseCSVRow(lineas[j]);
                var pjNombre = $.trim(cols[0]);
                var famaPts = parseInt($.trim(cols[1]), 10) || 0;

                if (pjNombre) {
                    personajes.push({
                        nombre: pjNombre,
                        puntos: famaPts,
                        rango: calcularRango(famaPts)
                    });
                }
            }

            // Ordenar de mayor a menor puntuación
            personajes.sort(function(a, b) { return b.puntos - a.puntos; });

            // Inyectar en el DOM dividiendo Top 10 y el resto
            for (var i = 0; i < personajes.length; i++) {
                var pj = personajes[i];
                var posicion = i + 1;

                if (i < 10) {
                    $("#mha-top-10").append(
                        '<div class="mha-card-big">' +
                            '<div class="mha-rank-num">' + posicion + '</div>' +
                            '<span class="mha-rank-badge">' + pj.rango + '</span>' +
                                '<div> <div class="mha-rank-name">'
                                     + pj.nombre +
                                '</div>' +
                                '<div class="mha-rank-score">' + pj.puntos + ' pts</div>' +
                            '</div>' +
                        '</div>'
                    );
                } else {
                    $("#mha-resto").append(
                        '<div class="mha-card-small">' +
                            '<span class="mha-rank-name"><b>' + posicion + '</b> <span class="mha-rank-badge">' + pj.rango + '</span> ' + pj.nombre + '</span>' +
                            '<span class="mha-rank-score">' + pj.puntos + ' pts</span>' +
                        '</div>'
                    );
                }
            }
        }
    });
});