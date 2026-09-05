$(function () {

    // 1. DETECCIÓN RÁPIDA: Si no hay combates, no gastamos recursos
    if ($("combate").length === 0) return;

    // ==========================================
    // 2. ENLACE A TU EXCEL (Pestaña Perfil)
    // ==========================================
    const urlExcelPerfil = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_K1Xk7MDNcyCVV9jO1zwI9pIGaSPcxCwy-3f7J1kH2uDdn7m0TkceDwjOMKwYt7XL-KAUVRTalB5m/pub?gid=389642535&single=true&output=csv";

    // ==========================================
    // 3. CONFIGURACIÓN DE TIRADAS Y STATS
    // ==========================================
    const tiposTirada = {
        INI: { nombre: "Iniciativa", icono: "fa-solid fa-flag-checkered", dado: "D10", dadosEsperados: 1, stat: "vel", compara: false },
        ACC: { nombre: "Acción", icono: "fa-solid fa-swords", dado: "D10", dadosEsperados: 2, compara: true },
        SAL: { nombre: "Salvación", icono: "fa-solid fa-shield-heart", dado: "D10", dadosEsperados: 2, compara: false },
        RES: { nombre: "Resistencia", icono: "fa-solid fa-shield", dado: "D10", dadosEsperados: 2, compara: false },
        DMG: { nombre: "Daño", icono: "fa-solid fa-burst", dano: true }
    };

    const nombresStats = {
        fue: "Fuerza", des: "Destreza", res: "Resistencia", vol: "Voluntad",
        int: "Inteligencia", vel: "Velocidad", eva: "Evasión", cor: "Coraje"
    };

    // ==========================================
    // 4. PARSER CSV ROBUSTO (Clonado del Perfil)
    // ==========================================
    function parseCSVRow(str) {
        var result = [], current = "", inQuotes = false;
        for (var i = 0; i < str.length; i++) {
            var char = str[i];
            if (char === '"') {
                if (inQuotes && str[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = "";
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    // ==========================================
    // 5. DESCARGA Y RENDERIZADO MÁGICO
    // ==========================================
    $.ajax({
        url: urlExcelPerfil,
        type: "GET",
        dataType: "text",
        success: function (data) {

            const DB_COMBATE = {};
            const lineasPerfil = data.split(/\r?\n/);
            const parsedRows = lineasPerfil.map(parseCSVRow);

            const row1 = parsedRows[1].map(function (s) { return $.trim(s).toLowerCase(); });

            const headerMap = {};
            for (let k = 0; k < row1.length; k++) {
                let colName = row1[k];
                if (colName !== undefined && colName !== "") {
                    if (headerMap[colName] === undefined) headerMap[colName] = k;
                }
            }

            // --- MOTOR DE MAPEO DE 3 BLOQUES (Clonado del Perfil) ---
            function getStatIndices(startIdx) {
                var map = { fue: -1, res: -1, des: -1, int: -1, vel: -1, vol: -1 };
                if (startIdx === -1) return map;
                for (var i = startIdx; i < startIdx + 10 && i < row1.length; i++) {
                    var c = row1[i];
                    if (c === "fue" && map.fue === -1) map.fue = i;
                    if (c === "res" && map.res === -1) map.res = i;
                    if (c === "des" && map.des === -1) map.des = i;
                    if (c === "int" && map.int === -1) map.int = i;
                    if (c === "vel" && map.vel === -1) map.vel = i;
                    if (c === "vol" && map.vol === -1) map.vol = i;
                }
                return map;
            }

            var todasLasFue = [];
            for (var i = 0; i < row1.length; i++) { if (row1[i] === "fue") todasLasFue.push(i); }

            var mapBase = { fue: -1, res: -1, des: -1, int: -1, vel: -1, vol: -1 };
            var mapComp = { fue: -1, res: -1, des: -1, int: -1, vel: -1, vol: -1 };
            var mapRasg = { fue: -1, res: -1, des: -1, int: -1, vel: -1, vol: -1 };

            if (todasLasFue.length >= 1) mapBase = getStatIndices(todasLasFue[0]);
            if (todasLasFue.length >= 2) mapComp = getStatIndices(todasLasFue[1]);
            if (todasLasFue.length >= 3) mapRasg = getStatIndices(todasLasFue[2]);

            function valP(cols, key1) {
                var idx = headerMap[key1.toLowerCase()];
                if (idx !== undefined && cols[idx] !== undefined) return $.trim(cols[idx]);
                return "";
            }

            function getNum(cols, idx) {
                if (idx === -1 || cols[idx] === undefined) return 0;
                var n = parseInt($.trim(cols[idx]), 10);
                return isNaN(n) ? 0 : n;
            }

            function extraerHabilidades(diccionario, textoCelda, nivel) {
                if (!textoCelda) return;
                let lista = textoCelda.split(/[,;]/);
                lista.forEach(hab => {
                    let nombreLimpio = $.trim(hab).toLowerCase();
                    if (nombreLimpio !== "") {
                        diccionario[nombreLimpio] = nivel;
                    }
                });
            }

            // BUCLE INVERTIDO (De abajo hacia arriba para agarrar al más actualizado)
            for (let j = parsedRows.length - 1; j >= 2; j--) {
                let cols = parsedRows[j];
                if (cols.length < 5) continue;

                let check = valP(cols, "ok?").toUpperCase();
                let pjNombre = valP(cols, "nombre").toLowerCase();

                // Si es un PJ validado y NO lo hemos registrado antes
                if ((check === "TRUE" || check === "✅" || check === "V") && pjNombre !== "" && !DB_COMBATE[pjNombre]) {

                    // Cálculo Matemático Total (Base + Comprados + Rasgos)
                    function calcStatTotal(statName) {
                        return getNum(cols, mapBase[statName]) + getNum(cols, mapComp[statName]) + getNum(cols, mapRasg[statName]);
                    }

                    let misHabilidades = {};
                    extraerHabilidades(misHabilidades, valP(cols, "habilidadesnivel1"), 1);
                    extraerHabilidades(misHabilidades, valP(cols, "habilidadesnivel2"), 2);
                    extraerHabilidades(misHabilidades, valP(cols, "habilidadesnivel3"), 3);
                    extraerHabilidades(misHabilidades, valP(cols, "habilidadesnivel4"), 4);
                    extraerHabilidades(misHabilidades, valP(cols, "habilidadesnivel5"), 5);

                    DB_COMBATE[pjNombre] = {
                        hp: getNum(cols, headerMap["salud"]),
                        st: getNum(cols, headerMap["estamina"]),
                        fue: calcStatTotal("fue"),
                        des: calcStatTotal("des"),
                        res: calcStatTotal("res"),
                        vol: calcStatTotal("vol"),
                        int: calcStatTotal("int"),
                        vel: calcStatTotal("vel"),
                        eva: getNum(cols, headerMap["evasión"]) || getNum(cols, headerMap["evasion"]),
                        cor: getNum(cols, headerMap["coraje"]),
                        habilidades: misHabilidades
                    };
                }
            }

            // ==========================================
            // 6. INYECTAR LAS TIRADAS EN EL HTML
            // ==========================================
            $("combate").each(function () {
                const combate = $(this);
                combate.prepend(`<turno>Turno ${combate.attr("turno")}</turno>`);

                combate.find("pj").each(function () {
                    const pj = $(this);
                    let nombre = pj.attr("name");

                    if (!nombre) {
                        nombre = $.trim(pj.closest(".post-bigwrap").find(".topbarprf-name strong, .topbarprf-name a, .topbarprf-name").first().text());
                    }

                    const datos = DB_COMBATE[nombre.toLowerCase()];

                    if (!datos) {
                        pj.html(`<b>Personaje "${nombre}" no encontrado en los registros validados.</b>`);
                        return;
                    }

                    // --- Renderizado de Cabecera (HP/ST) ---
                    let html = `
                        <name>${nombre}</name>
                        <bs class="barras">
                            <bas>
                                <label><i class="fa-solid fa-briefcase-medical"></i> Salud <valor>${pj.attr("hp")}/${datos.hp}</valor></label>
                                <progress class="hp" value="${pj.attr("hp")}" max="${datos.hp}"></progress>
                                
                            </bas>
                            <bas>
                                <label><i class="fa-solid fa-battery-bolt"></i> Estamina <valor>${pj.attr("st")}/${datos.st}</valor></label>
                                <progress class="st" value="${pj.attr("st")}" max="${datos.st}"></progress>
                                
                            </bas>
                        </bs>
                    `;

                    // --- Renderizado de Tiradas ---
                    pj.find("roll").each(function () {
                        const roll = $(this);
                        const tipo = tiposTirada[roll.attr("type")];
                        if (!tipo) return;

                        // 1. STAT
                        const stat = tipo.stat || roll.attr("stat");
                        const valorStat = (stat && datos[stat]) ? datos[stat] : 0;
                        const nombreStat = nombresStats[stat] || stat || "";

                        // 2. HABILIDAD POR NOMBRE
                        const nombreHab = roll.attr("hab");
                        let valorHab = 0;
                        let nombreHabVisual = "";

                        if (nombreHab && datos.habilidades) {
                            const habBuscada = $.trim(nombreHab).toLowerCase();
                            if (datos.habilidades[habBuscada]) {
                                valorHab = datos.habilidades[habBuscada];
                                nombreHabVisual = $.trim(nombreHab);
                            }
                        }

                        // 3. MODIFICADOR EXTERNO (Buffs/Debuffs)
                        const modText = roll.attr("mod");
                        const valorMod = modText ? Number(modText) : 0;
                        const nombreMod = roll.attr("modname") || "Modificador";

                        // 4. DADO
                        const tipoDado = roll.attr("dado") || tipo.dado || "D10";

                        // 5. RESULTADOS (Con colores para Crítico y Pifia)
                        const dadosText = roll.attr("dice");
                        const dados = dadosText ? dadosText.split(",").map(x => Number(x.trim())) : [0];

                        const dadosVisuales = dados.map(d => {
                            if (d === 10) return `<b style="color: var(--gr7a);">${d}</b>`; // Oro
                            if (d === 1) return `<b style="color: var(--gr5a);">${d}</b>`;  // Rojo
                            return d;
                        });

                        const totalDados = dados.reduce((a, b) => a + b, 0);
                        const total = totalDados + valorStat + valorHab + valorMod;

                        // 6. FÓRMULA VISUAL
                        let formulaTexto = `${dados.length}${tipoDado} (${dadosVisuales.join(", ")})`;

                        if (stat) {
                            formulaTexto += ` + ${nombreStat} (${valorStat})`;
                        }

                        if (valorHab > 0) {
                            formulaTexto += ` + ${nombreHabVisual} (${valorHab})`;
                        }

                        if (valorMod !== 0) {
                            const signo = valorMod > 0 ? "+" : "-";
                            // Usamos Math.abs para no imprimir "+ -2", sino "- 2"
                            formulaTexto += ` ${signo} ${nombreMod} (${Math.abs(valorMod)})`; 
                        }

                        formulaTexto += ` = <strong>${total}</strong>`;

                        html += `
                            <bs class="roll ${roll.attr("type")}">
                                <b>
                                    <i class="${tipo.icono}"></i> ${tipo.nombre}
                                </b>
                                <formula>
                                    ${formulaTexto}
                                </formula>
                        `;

                        // 7. COMPARACIÓN (Target vs RD)
                        const target = roll.attr("target");
                        const rd = roll.attr("rd");

                        if (target) {
                            const enemigo = DB_COMBATE[target.toLowerCase()];
                            if (enemigo) {
                                const hit = total >= enemigo.eva;
                                html += `
            <resultado class="${hit ? "hit" : "miss"}">
                VS ${target} (${enemigo.eva}) ${hit ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-xmark"></i>'}
            </resultado>
        `;
                            } else {
                                html += `<resultado class="miss">VS ${target} <i class="fa-solid fa-circle-exclamation"></i> (No encontrado)</resultado>`;
                            }
                        } else if (rd) {
                            const dificultad = Number(rd);
                            const hit = total >= dificultad;
                            html += `
        <resultado class="${hit ? "hit" : "miss"}">
            VS RD (${dificultad}) ${hit ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-xmark"></i>'}
        </resultado>
    `;
                        }

                        html += "</bs>";
                    });

                    pj.html(html);
                });
            });
        },
        error: function () {
            console.log("Error crítico: No se pudo enlazar la base de datos de combate.");
        }
    });
});