jQuery(document).ready(function($) {
    // 1. DETECCIÓN RÁPIDA
    if ($("mini-id").length === 0) return;

    // 2. ENLACES A TUS EXCEL
    const urlExcelPerfil = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_K1Xk7MDNcyCVV9jO1zwI9pIGaSPcxCwy-3f7J1kH2uDdn7m0TkceDwjOMKwYt7XL-KAUVRTalB5m/pub?gid=389642535&single=true&output=csv";
    const urlExcelBases  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_K1Xk7MDNcyCVV9jO1zwI9pIGaSPcxCwy-3f7J1kH2uDdn7m0TkceDwjOMKwYt7XL-KAUVRTalB5m/pub?gid=993389479&single=true&output=csv";
    const urlExcelTecnicas = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSEeIwauVajTj9PP8i7iII6O6bchcaId-cYdA0Xb6HqnetaINz-SOM_dm3hTUadFWdjMuLVvEUAdQX9/pub?gid=0&single=true&output=csv";

    // 3. PARSER CSV ROBUSTO
    function parseCSVRow(str) {
        let result = [], current = "", inQuotes = false;
        for (let i = 0; i < str.length; i++) {
            let char = str[i];
            if (char === '"') {
                if (inQuotes && str[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
                result.push(current); current = "";
            } else { current += char; }
        }
        result.push(current); return result;
    }

    // 4. DESCARGA CONCURRENTE DE LOS 3 ARCHIVOS
    let reqBases = $.ajax({ url: urlExcelBases, type: "GET", dataType: "text" });
    let reqPerfil = $.ajax({ url: urlExcelPerfil, type: "GET", dataType: "text" });
    let reqTecnicas = $.ajax({ url: urlExcelTecnicas, type: "GET", dataType: "text" });

    $.when(reqBases, reqPerfil, reqTecnicas).done(function(resBases, resPerfil, resTecnicas) {
        const DB_BASES = {};
        const DB_TECNICAS = {};
        const DB_MINI = {};

        // --- A. PROCESAR BASES STATS ---
        let lineasBases = resBases[0].split(/\r?\n/);
        let headersBases = parseCSVRow(lineasBases[0]).map(h => $.trim(h).toLowerCase());
        let idxRasgos = headersBases.lastIndexOf("rasgos");
        let idxRasgoEf = headersBases.lastIndexOf("rasgoefecto");
        let idxDeb = headersBases.lastIndexOf("debilidades");
        let idxDebEf = headersBases.lastIndexOf("debilidadefecto");

        for (let i = 1; i < lineasBases.length; i++) {
            if (!lineasBases[i]) continue;
            let colsB = parseCSVRow(lineasBases[i]);
            if (idxRasgos !== -1 && colsB[idxRasgos]) {
                DB_BASES[$.trim(colsB[idxRasgos]).toLowerCase()] = { desc: colsB[idxRasgoEf] ? $.trim(colsB[idxRasgoEf]) : "" };
            }
            if (idxDeb !== -1 && colsB[idxDeb]) {
                DB_BASES[$.trim(colsB[idxDeb]).toLowerCase()] = { desc: colsB[idxDebEf] ? $.trim(colsB[idxDebEf]) : "" };
            }
        }

        // --- B. PROCESAR TÉCNICAS ---
        let lineasTecnicas = resTecnicas[0].split(/\r?\n/);
        let parsedTecnicas = lineasTecnicas.map(parseCSVRow);

        for (let i = 1; i < parsedTecnicas.length; i++) {
            let colT = parsedTecnicas[i];
            if (colT.length < 5) continue;

            let verif = $.trim(colT[0]).toUpperCase();
            let pjNom = $.trim(colT[1]).toLowerCase();

            if ((verif === "TRUE" || verif === "✅") && pjNom !== "") {
                if (!DB_TECNICAS[pjNom]) DB_TECNICAS[pjNom] = {};

                let tNombre = $.trim(colT[2]);
                let tAtributo = $.trim(colT[3]);
                let tDesc = $.trim(colT[4]);
                let tEfecto = $.trim(colT[5]); 
                let tCoste = $.trim(colT[6]);  
                let tDificultad = $.trim(colT[7]); 
                let tNivel = $.trim(colT[8]) || "Otros movimientos"; 

                if (!DB_TECNICAS[pjNom][tNivel]) DB_TECNICAS[pjNom][tNivel] = [];

                DB_TECNICAS[pjNom][tNivel].push({
                    nombre: tNombre, atributo: tAtributo, desc: tDesc, coste: tCoste, dificultad: tDificultad, efecto: tEfecto
                });
            }
        }

        // --- C. PROCESAR PERFIL Y MAPEO ---
        let lineasPerfil = resPerfil[0].split(/\r?\n/);
        let parsedRows = lineasPerfil.map(parseCSVRow);
        let row1 = parsedRows[1].map(s => $.trim(s).toLowerCase());
        let headerMap = {};

        for (let k = 0; k < row1.length; k++) {
            let colName = row1[k];
            if (colName && headerMap[colName] === undefined) headerMap[colName] = k;
        }

        function getStatIndices(startIdx) {
            let map = { fue: -1, res: -1, des: -1, int: -1, vel: -1, vol: -1 };
            if (startIdx === -1) return map;
            for (let i = startIdx; i < startIdx + 10 && i < row1.length; i++) {
                let c = row1[i];
                if (c === "fue" && map.fue === -1) map.fue = i;
                if (c === "res" && map.res === -1) map.res = i;
                if (c === "des" && map.des === -1) map.des = i;
                if (c === "int" && map.int === -1) map.int = i;
                if (c === "vel" && map.vel === -1) map.vel = i;
                if (c === "vol" && map.vol === -1) map.vol = i;
            }
            return map;
        }

        let todasLasFue = [];
        for (let i = 0; i < row1.length; i++) { if (row1[i] === "fue") todasLasFue.push(i); }
        let mapBase = getStatIndices(todasLasFue[0] ?? -1);
        let mapComp = getStatIndices(todasLasFue[1] ?? -1);
        let mapRasg = getStatIndices(todasLasFue[2] ?? -1);

        function valP(cols, key1) {
            let idx = headerMap[key1.toLowerCase()];
            return (idx !== undefined && cols[idx] !== undefined) ? $.trim(cols[idx]) : "";
        }
        function getNum(cols, idx) {
            if (idx === -1 || cols[idx] === undefined) return 0;
            let n = parseInt($.trim(cols[idx]), 10);
            return isNaN(n) ? 0 : n;
        }

        for (let j = parsedRows.length - 1; j >= 2; j--) {
            let cols = parsedRows[j];
            if (cols.length < 5) continue;
            let check = valP(cols, "ok?").toUpperCase();
            let pjNombre = valP(cols, "nombre").toLowerCase();

            if ((check === "TRUE" || check === "✅") && pjNombre !== "" && !DB_MINI[pjNombre]) {

                function calcStatText(statName) {
                    let base = getNum(cols, mapBase[statName]);
                    let comp = getNum(cols, mapComp[statName]);
                    let rasg = getNum(cols, mapRasg[statName]);
                    let totalSuma = base + comp;
                    let textOutput = totalSuma.toString();
                    if (rasg > 0) textOutput += " + " + rasg;
                    else if (rasg < 0) textOutput += " - " + Math.abs(rasg);
                    return textOutput;
                }

                let stringRasgos = valP(cols, "rasgos");
                let stringDebilidades = valP(cols, "debilidades");
                let arrRasgos = [], arrDebil = [];

                if (stringRasgos) {
                    stringRasgos.split(",").forEach(s => {
                        let sLimpio = $.trim(s);
                        if (sLimpio !== "") {
                            let info = DB_BASES[sLimpio.toLowerCase()];
                            let desc = info ? " " + info.desc : "";
                            arrRasgos.push(`<span class="item-rasgo"><strong>${sLimpio} </strong>${desc}</span>`);
                        }
                    });
                }
                if (stringDebilidades) {
                    stringDebilidades.split(",").forEach(s => {
                        let sLimpio = $.trim(s);
                        if (sLimpio !== "") {
                            let info = DB_BASES[sLimpio.toLowerCase()];
                            let desc = info ? " " + info.desc : "";
                            arrDebil.push(`<span class="item-debil"><strong>${sLimpio} </strong>${desc}</span>`);
                        }
                    });
                }

                let HTMLHabilidades = "";
                for (let lvl = 1; lvl <= 5; lvl++) {
                    let h_lvl_raw = valP(cols, "habilidadesnivel" + lvl);
                    if (h_lvl_raw && $.trim(h_lvl_raw) !== "") {
                        let skills = h_lvl_raw.split(',');
                        skills.forEach(skill => {
                            let skillName = $.trim(skill);
                            if (skillName !== "") {
                                let progressSpans = '';
                                for (let i = 1; i <= 5; i++) {
                                    let activeClass = (i <= lvl) ? 'class="active"' : '';
                                    progressSpans += `<span ${activeClass}></span>`;
                                }
                                HTMLHabilidades += `
                                <div class="mha-skill-box"><strong>✦ ${skillName}</strong> <span class="skill-level-text">Nivel ${lvl}</span>
                                    <div class="skill-progress-bar">${progressSpans}</div>
                                </div>`;
                            }
                        });
                    }
                }

                let HTMLTecnicas = "";
                let tecsDelPj = DB_TECNICAS[pjNombre];
                
                if (tecsDelPj) {
                    for (let nivel in tecsDelPj) {
                        HTMLTecnicas += `<h3>${nivel}</h3>`;
                        tecsDelPj[nivel].forEach(t => {
                            let atribText = t.atributo ? `(${t.atributo})` : "";
                            let costeText = t.coste ? `<span>Coste ${t.coste} EST</span>` : "";
                            let difText = t.dificultad ? `<span>${t.dificultad}</span>. ` : "";
                            let efectoText = t.efecto ? ` <efec><strong>Efecto:</strong> ${t.efecto}</efec>` : "";

                            HTMLTecnicas += `
                            <div class="tecnica-item">
                                <strong>✦ ${t.nombre}${atribText}.</strong> ${costeText}${difText}${t.desc}${efectoText}
                            </div>`;
                        });
                    }
                } else {
                    HTMLTecnicas = `<div class="tecnica-item">Sin técnicas registradas en el Ministerio.</div>`;
                }

                DB_MINI[pjNombre] = {
                    hpMax: getNum(cols, headerMap["salud"]),
                    stMax: getNum(cols, headerMap["estamina"]),
                    fue: calcStatText("fue"), res: calcStatText("res"), des: calcStatText("des"),
                    int: calcStatText("int"), vel: calcStatText("vel"), vol: calcStatText("vol"),
                    eva: getNum(cols, headerMap["evasión"]) || getNum(cols, headerMap["evasion"]),
                    cor: getNum(cols, headerMap["coraje"]),
                    db: valP(cols, "dañobase") || "1D6",
                    pu: valP(cols, "plusultra") || "0000",
                    rasgosHTML: arrRasgos.join("") + arrDebil.join(""),
                    habsHTML: HTMLHabilidades,
                    tecsHTML: HTMLTecnicas
                };
            }
        }

        // --- D. INYECCIÓN DINÁMICA EN EL DOM ---
        $("mini-id").each(function () {
            let el = $(this);
            
            let nombre = el.attr("name") || el.find(".name").text().trim();
            let hpActual = el.attr("hp") || el.find(".hp").attr("value") || "0";
            let stActual = el.attr("st") || el.find(".st").attr("value") || "0";
            let avatar = el.attr("ava") || el.find(".avie").attr("src") || "https://i.ibb.co/placeholder.jpg";
            
            // NUEVO: Ahora por defecto es "no". Solo mostrará técnicas si explícitamente se pone tecnicas="si".
            let mostrarTecnicas = el.attr("tecnicas") ? el.attr("tecnicas").toLowerCase() : "no"; 

            if (!nombre) return;
            
            let key = nombre.toLowerCase();
            let datos = DB_MINI[key];

            if (!datos) {
                el.html(`<div style="padding:10px; border:1px solid red; color:red; font-weight:bold;">El personaje "${nombre}" no fue encontrado en los registros.</div>`);
                return;
            }

            // Construcción Condicional de las Técnicas
            let bloqueTecnicasHTML = "";
            if (mostrarTecnicas === "si" || mostrarTecnicas === "yes") {
                bloqueTecnicasHTML = `
                <h-col class="tecnicas">
                    <div class="prfl-tecnicas"><i class="fa-solid fa-burst back"></i>
                        <div class="heading">Técnicas</div>
                        <div class="prfl-tecnicas-p">
                            ${datos.tecsHTML}
                        </div>
                    </div>
                </h-col>`;
            }

            let finalHTML = `
            <h-col class="data">
                <span class="name"> ${nombre}</span>
                <img class="avie" src="${avatar}" />
                <bs class="barras">
                    <bas>
                        <label><i class="fa-solid fa-briefcase-medical"></i> Salud <valor>${datos.hpMax}</valor></label>
                        <progress class="hp" value="${hpActual}" max="${datos.hpMax}"></progress>
                    </bas>
                    <bas>
                        <label><i class="fa-solid fa-battery-bolt"></i> EST <valor>${datos.stMax}</valor></label>
                        <progress class="st" value="${stActual}" max="${datos.stMax}"></progress>
                    </bas>
                </bs>
            </h-col>
            <h-col class="stats-container">
                <div class="stats-c">
                    <div class="atr">Atributos Base</div>
                    <div class="stats"><span><i class="fa-solid fa-hand-fist"></i> FUE</span> ${datos.fue}</div>
                    <div class="stats"><span><i class="fa-solid fa-heart-pulse"></i> RES</span> ${datos.res}</div>
                    <div class="stats"><span><i class="fa-solid fa-bolt"></i> DES</span> ${datos.des}</div>
                    <div class="stats"><span><i class="fa-solid fa-brain"></i> INT</span> ${datos.int}</div>
                    <div class="stats"><span><i class="fa-solid fa-wind"></i> VEL</span> ${datos.vel}</div>
                    <div class="stats"><span><i class="fa-solid fa-fire"></i> VOL</span> ${datos.vol}</div>
                    
                    <div class="atr">Atributos Derivados</div>
                    <div class="stats"><span><i class="fa-solid fa-shuffle"></i> EVA</span> ${datos.eva}</div>
                    <div class="stats"><span><i class="fa-solid fa-shield"></i> COR</span> ${datos.cor}</div>
                    <div class="stats "><span><i class="fa-solid fa-burst"></i> DB</span> ${datos.db}</div>
                    <div class="stats"><span><i class="fa-solid fa-infinity"></i> PU</span> ${datos.pu}</div>
                </div>
            </h-col>
            <h-col class="habs">
                <div class="heading">Rasgos & Debilidades</div>
                <div class="prfl-rasgos-p accents">${datos.rasgosHTML}</div>

                <div class="heading">Habilidades</div>
                ${datos.habsHTML}
            </h-col>
            ${bloqueTecnicasHTML}
            `;

            el.html(finalHTML);
        });

    }).fail(function() {
        console.log("Error al cargar los CSV del Sistema de Mini-ID.");
    });
});