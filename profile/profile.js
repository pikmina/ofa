$(document).ready(function() {
    // =========================================================================
    // CONFIGURACIÓN CENTRALIZADA (PEGA AQUÍ EL ID DE TU SPREADSHEET)
    // =========================================================================
    var GOOGLE_SHEET_ID = "1ipSletyvTWIpLOwSDqK63_In7EHvrmE8EEmfDguxfj4";
    var HOJA_PERFIL = "Perfil";
    var HOJA_BASES  = "BasesStats";

    // Detectar entorno de Foroactivo (modernbb) de manera segura
    var es_perfil = window.location.pathname.indexOf("/u") === 0;
    var es_tema   = window.location.pathname.indexOf("/t") === 0;
    if (!es_perfil && !es_tema) return;

    // Conexión limpia mediante la API de visualización nativa (Formato JSON/CSV de lectura)
    var url_api_perfil = "https://docs.google.com/spreadsheets/d/" + GOOGLE_SHEET_ID + "/gviz/tq?sheet=" + encodeURIComponent(HOJA_PERFIL);
    var url_api_bases  = "https://docs.google.com/spreadsheets/d/" + GOOGLE_SHEET_ID + "/gviz/tq?sheet=" + encodeURIComponent(HOJA_BASES);

    var DB_SISTEMA_PF = {};
    var DB_BASES_DESCRIPCIONES_B = {};

    // =========================================================================
    // PASO 1: TRAER LA HOJA "BasesStats" PARA LAS DESCRIPCIONES
    // =========================================================================
    $.ajax({
        url: url_api_bases,
        type: "GET",
        dataType: "text",
        success: function(raw_data) {
            var json_data = parsearGoogleJSON(raw_data);
            if (!json_data) return;

            json_data.table.rows.forEach(function(fila) {
                var celdas = fila.c;
                if (!celdas || !celdas[0]) return;

                // Variables identificadoras con el prefijo de la hoja 'b_'
                var b_stat_nombre      = $.trim(celdas[0].v).toLowerCase();
                var b_stat_descripcion = celdas[1] ? $.trim(celdas[1].v) : "";
                var b_stat_tipo        = celdas[2] ? $.trim(celdas[2].v).toLowerCase() : "rasgo"; 

                DB_BASES_DESCRIPCIONES_B[b_stat_nombre] = {
                    descripcion: b_stat_descripcion,
                    tipo: b_stat_tipo
                };
            });

            // Con la base cargada en memoria, cargamos los perfiles
            cargarHojaPerfiles();
        }
    });

    // =========================================================================
    // PASO 2: CARGAR LA HOJA "Perfil" Y CONSTRUIR EL SISTEMA CRUZADO
    // =========================================================================
    function cargarHojaPerfiles() {
        $.ajax({
            url: url_api_perfil,
            type: "GET",
            dataType: "text",
            success: function(raw_data) {
                var json_data = parsearGoogleJSON(raw_data);
                if (!json_data) return;

                json_data.table.rows.forEach(function(fila) {
                    var c = fila.c;
                    if (!c || !c[1]) return; 

                    // Filtro seguro: Primera columna (A) obligatoria en TRUE
                    var pf_check_verificacion = c[0] ? c[0].v : false;
                    if (pf_check_verificacion !== true && pf_check_verificacion !== "TRUE") return;

                    var pf_string_personaje = $.trim(c[1].v).toLowerCase();

                    // --- PROCESAMIENTO MATEMÁTICO: ATRIBUTOS (Base + Compras) + Rasgos ---
                    var fue_calc = (obtenerNum(c[2]) + obtenerNum(c[3])) + (obtenerNum(c[4]) > 0 ? "+" + obtenerNum(c[4]) : "");
                    var res_calc = (obtenerNum(c[5]) + obtenerNum(c[6])) + (obtenerNum(c[7]) > 0 ? "+" + obtenerNum(c[7]) : "");
                    var des_calc = (obtenerNum(c[8]) + obtenerNum(c[9])) + (obtenerNum(c[10]) > 0 ? "+" + obtenerNum(c[10]) : "");
                    var int_calc = (obtenerNum(c[11]) + obtenerNum(c[12])) + (obtenerNum(c[13]) > 0 ? "+" + obtenerNum(c[13]) : "");
                    var vel_calc = (obtenerNum(c[14]) + obtenerNum(c[15])) + (obtenerNum(c[16]) > 0 ? "+" + obtenerNum(c[16]) : "");
                    var vol_calc = (obtenerNum(c[17]) + obtenerNum(c[18])) + (obtenerNum(c[19]) > 0 ? "+" + obtenerNum(c[19]) : "");

                    // Vitales y Atributos Derivados
                    var pf_num_salud         = c[20] ? c[20].v : "0";
                    var pf_num_estamina      = c[21] ? c[21].v : "0";
                    var pf_num_evasion       = c[22] ? c[22].v : "0";
                    var pf_num_def_mental    = c[23] ? c[23].v : "0";
                    var pf_string_dano_base  = c[24] ? c[24].v : "1D6";
                    var pf_num_plus_ultra    = c[25] ? c[25].v : "0000";

                    // --- CRUCE AVANZADO DE RASGOS CON LA HOJA "BasesStats" ---
                    var pf_string_lista_stats = c[26] ? c[26].v.split(",") : [];
                    var lista_rasgos = [];
                    var lista_debilidades = [];

                    pf_string_lista_stats.forEach(function(stat_nombre) {
                        var nombre_limpio = $.trim(stat_nombre);
                        var llave_busqueda = nombre_limpio.toLowerCase();

                        if (DB_BASES_DESCRIPCIONES_B[llave_busqueda]) {
                            var info = DB_BASES_DESCRIPCIONES_B[llave_busqueda];
                            var html_formateado = "<li><strong>" + nombre_limpio + ".</strong> " + info.descripcion + "</li>";
                            
                            if (info.tipo === "debilidad") {
                                lista_debilidades.push({ nombre: nombre_limpio, html: html_formateado });
                            } else {
                                lista_rasgos.push({ nombre: nombre_limpio, html: html_formateado });
                            }
                        }
                    });

                    // Ordenar Alfabéticamente por separado (A-Z)
                    lista_rasgos.sort(function(a, b){ return a.nombre.localeCompare(b.nombre); });
                    lista_debilidades.sort(function(a, b){ return a.nombre.localeCompare(b.nombre); });

                    // Consolidar el orden estricto solicitado: Primero Rasgos, luego Debilidades
                    var html_rasgos_debilidades_final = lista_rasgos.map(function(r){ return r.html; }).join("") + 
                                                        lista_debilidades.map(function(d){ return d.html; }).join("");

                    // --- JALADO DE OTROS ELEMENTOS DE LA HOJA ---
                    var pf_string_nivel_quirk  = c[27] ? $.trim(c[27].v) : "";
                    var pf_html_quirk_desc     = c[28] ? $.trim(c[28].v) : "";
                    var pf_html_habilidades    = c[29] ? $.trim(c[29].v) : "";
                    var pf_html_certificaciones = c[30] ? $.trim(c[30].v) : "";
                    var pf_html_inventario     = c[31] ? $.trim(c[31].v) : "";

                    // Guardamos el mapa en el diccionario global
                    DB_SISTEMA_PF[pf_string_personaje] = {
                        fuerza: fue_calc, resistance: res_calc, destreza: des_calc,
                        inteligencia: int_calc, velocidad: vel_calc, voluntad: vol_calc,
                        salud: pf_num_salud, estamina: pf_num_estamina, evasion: pf_num_evasion,
                        def_mental: pf_num_def_mental, dano_base: pf_string_dano_base, plus_ultra: pf_num_plus_ultra,
                        rasgos_html: html_rasgos_debilidades_final,
                        nivel_quirk: pf_string_nivel_quirk,
                        quirk_desc: pf_html_quirk_desc,
                        habilidades: pf_html_habilidades,
                        certificaciones: pf_html_certificaciones,
                        inventario: pf_html_inventario
                    };
                });

                // Pequeño retraso seguro para evitar conflictos de carga asíncrona en modernbb
                setTimeout(function() { ejecutarInyeccionForo(); }, 150);
            }
        });
    }

    // =========================================================================
    // MOTOR DE RENDERIZADO VISUAL ADAPTADO A TU DOM REAL
    // =========================================================================
    function ejecutarInyeccionForo() {
        if (es_perfil) {
            var nombre_perfil = $.trim($('.topbarprf-name strong').text()).toLowerCase();
            var pj = DB_SISTEMA_PF[nombre_perfil];
            if (pj) inyectarBloque(null, pj);
        }

        if (es_tema) {
            $('.post-bigwrap, .post').each(function() {
                var $post = $(this);
                var nombre_autor = $.trim($post.find('.topbarprf-name strong, .postprofile-name a').text()).toLowerCase();
                var pj = DB_SISTEMA_PF[nombre_autor];
                if (pj) inyectarBloque($post, pj);
            });
        }
    }

    function inyectarBloque($contexto, pj) {
        var selector = function(clase) { return $contexto ? $contexto.find(clase) : $(clase); };

        // 1. Inyección Completa de Atributos Base y Derivados (.mystats .field_uneditable)
        selector('.stat1 .field_uneditable').html(pj.fuerza);
        selector('.stat2 .field_uneditable').html(pj.resistance);
        selector('.stat3 .field_uneditable').html(pj.destreza);
        selector('.stat4 .field_uneditable').html(pj.inteligencia);
        selector('.stat5 .field_uneditable').html(pj.velocidad);
        selector('.stat6 .field_uneditable').html(pj.voluntad);
        selector('.stat7 .field_uneditable').html(pj.salud);
        selector('.stat8 .field_uneditable').html(pj.estamina);
        selector('.stat9 .field_uneditable').html(pj.evasion);
        selector('.stat10 .field_uneditable').html(pj.def_mental);
        selector('.stat11 .field_uneditable').html(pj.dano_base);
        selector('.stat12 .field_uneditable').html(pj.plus_ultra);

        // 2. Inyección de Rasgos y Debilidades combinados con la hoja de catálogo global
        if (pj.rasgos_html) {
            selector('.prfl-rasgos-p .field_uneditable').html("<ul class='profile_field_list'>" + pj.rasgos_html + "</ul>");
        }

        // 3. Inyección del Nivel y la Descripción del Quirk
        if (pj.nivel_quirk) selector('ndq i .field_uneditable').html(pj.nivel_quirk);
        if (pj.quirk_desc) selector('.ava-main-paragr .field_uneditable').html(pj.quirk_desc);

        // 4. Inyección del resto de bloques de Sistema (Habilidades, Certificaciones e Inventario)
        if (pj.habilidades) selector('.prf-habilidades-p .field_uneditable').html(pj.habilidades);
        if (pj.certificaciones) selector('.prfl-certificaciones-p .field_uneditable').html(pj.certificaciones);
        if (pj.inventario) selector('.footer-inventory-items .field_uneditable').html(pj.inventario);
    }

    function parsearGoogleJSON(raw) {
        try {
            var inicio = raw.indexOf("google.visualization.Query.setResponse(");
            if (inicio === -1) return null;
            var limpio = raw.substring(inicio + 38, raw.length - 2);
            return JSON.parse(limpio);
        } catch (e) { return null; }
    }

    function obtenerNum(objeto_celda) {
        if (!objeto_celda || objeto_celda.v === null || objeto_celda.v === undefined) return 0;
        var n = parseInt(objeto_celda.v, 10);
        return isNaN(n) ? 0 : n;
    }
});