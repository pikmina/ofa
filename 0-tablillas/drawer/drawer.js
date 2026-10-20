jQuery(document).ready(function ($) {
    var API_BASE_URL = "https://app.oneforallrpg.org";
    var characterCache = {}; // Memoria caché para evitar consultas redundantes

    // ========================================================
    // 1. CONSULTA A LA API DE SHADOWAPP
    // ========================================================
    async function cargarFichaDesdeAPI(characterName) {
        if (!characterName) return;

        // Limpiar barras invertidas (\), slashes o espacios
        var cleanName = characterName.replace(/^[\\/@#\s]+/, '').trim();
        if (!cleanName) return;

        // Indicadores de carga en el Drawer
        $('#drawer-health, #drawer-stamina').text('...');
        $('#drawer-initiative, #drawer-iniciativa').text('...');
        $('#drawer-phys-dmg, #drawer-dano-fisico').text('...');
        $('#drawer-range-dmg, #drawer-dano-rango').text('...');
        $('#drawer-dmg-reduc, #drawer-reduccion-dano').text('...');
        $('#drawer-mod-fue, #drawer-mod-des').text('...');
        $('#drawer-char-quirk-level, #drawer-quirk-level').text('...');
        $('#drawer-char-stage, #drawer-stage').text('...');

        // Si ya está en memoria caché, renderizar directamente
        if (characterCache[cleanName]) {
            renderizarDatosRPG(characterCache[cleanName]);
            return;
        }

        $.ajax({
            url: API_BASE_URL + "/api/public/character/" + encodeURIComponent(cleanName),
            method: "GET",
            dataType: "json",
            crossDomain: true,
            success: function (char) {
                characterCache[cleanName] = char;
                renderizarDatosRPG(char);
            },
            error: function (xhr, status, error) {
                console.warn("No se pudo cargar la ficha RPG de:", cleanName, error);
                $('#drawer-health, #drawer-stamina').text('--');
            }
        });
    }

    // ========================================================
    // 2. INYECCIÓN DE DATOS EN EL DOM DEL DRAWER
    // ========================================================
    function renderizarDatosRPG(char) {
        var prof = char.profileData || {};
        var attrs = prof.atributos || {};
        var stats = char.stats || {};
        var possessions = Array.isArray(char.possessions) ? char.possessions : [];

        // --- IDENTIDAD, QUIRK (DON) Y ETAPA ---
        var quirkName = prof.quirk_name || prof.quirkName || prof.don_name || prof.don || '';
        var quirkLevel = prof.quirk_level || prof.quirkLevel || prof.nivel_de_quirk || prof.quirk_evolution || prof.quirkEvolution || '';
        var etapa = prof.basic_stage || prof.stage || prof.etapa || '';

        if (quirkName) $('#drawer-char-quirk, #drawer-quirk-name, #drawer-don-nombre').text(quirkName);
        if (quirkLevel) $('#drawer-char-quirk-level, #drawer-quirk-level, #drawer-don-nivel').text(quirkLevel);
        if (etapa) $('#drawer-char-stage, #drawer-stage, #drawer-etapa').text(etapa);

        // --- SALUD Y ESTAMINA ---
        var res = attrs.res || prof.RES || 0;
        var des = attrs.des || prof.DES || 0;
        var saludMaxima = (stats.salud_maxima !== undefined) ? stats.salud_maxima : (prof.salud_maxima || (20 + res));
        var estaminaMaxima = (stats.estamina_maxima !== undefined) ? stats.estamina_maxima : (prof.estamina_maxima || (20 + des));

        $('#drawer-health').text(saludMaxima);
        $('#drawer-stamina').text(estaminaMaxima);

        // --- COMBATE: INICIATIVA, DEFENSAS Y DAÑOS ---
        var evasion = (stats.evasion !== undefined) ? stats.evasion : (prof.evasion || (10 + (attrs.vel || 0)));
        var coraje = (stats.coraje !== undefined) ? stats.coraje : (prof.coraje || (10 + (attrs.vol || 0)));
        var iniciativa = (stats.iniciativa !== undefined) ? stats.iniciativa : (prof.iniciativa || 0);
        var danoFisico = stats.daño_fisico || prof.daño_fisico || '1D8';
        var danoRango = stats.daño_rango || prof.daño_rango || '1D8';
        var reduccionDano = (stats.reduccion_dano !== undefined) ? stats.reduccion_dano : (prof.reduccion_dano || 0);

        $('#drawer-evasion').text(evasion);
        $('#drawer-courage, #drawer-coraje').text(coraje);
        $('#drawer-initiative, #drawer-iniciativa').text(iniciativa >= 0 ? '+' + iniciativa : iniciativa);
        $('#drawer-phys-dmg, #drawer-dano-fisico, #drawer-daño-fisico').text(danoFisico);
        $('#drawer-range-dmg, #drawer-dano-rango, #drawer-daño-rango').text(danoRango);
        $('#drawer-dmg-reduc, #drawer-reduccion-dano, #drawer-reduccion-daño').text(reduccionDano);

        // --- MODIFICADORES DE ATRIBUTOS ---
        var modFue = (stats.mod_fue !== undefined) ? stats.mod_fue : (prof.mod_fue !== undefined ? prof.mod_fue : Math.floor((attrs.fue || prof.FUE || 0) / 2));
        var modDes = (stats.mod_des !== undefined) ? stats.mod_des : (prof.mod_des !== undefined ? prof.mod_des : Math.floor((attrs.des || prof.DES || 0) / 2));
        $('#drawer-mod-fue, #drawer-mod-fuerza').text(modFue >= 0 ? '+' + modFue : modFue);
        $('#drawer-mod-des, #drawer-mod-destreza').text(modDes >= 0 ? '+' + modDes : modDes);

        // --- ATRIBUTOS PRIMARIOS (OPCIONALES) ---
        if ($('#drawer-attr-fue').length) $('#drawer-attr-fue').text(attrs.fue || prof.FUE || 0);
        if ($('#drawer-attr-des').length) $('#drawer-attr-des').text(attrs.des || prof.DES || 0);
        if ($('#drawer-attr-res').length) $('#drawer-attr-res').text(res);
        if ($('#drawer-attr-int').length) $('#drawer-attr-int').text(attrs.int || prof.INT || 0);
        if ($('#drawer-attr-vol').length) $('#drawer-attr-vol').text(attrs.vol || prof.VOL || 0);
        if ($('#drawer-attr-vel').length) $('#drawer-attr-vel').text(attrs.vel || prof.VEL || 0);

        // --- RASGOS (NOMBRE Y DESCRIPCIÓN) ---
        var $traitsContainer = $('#drawer-traits, #drawer-rasgos');
        if ($traitsContainer.length) {
            $traitsContainer.empty();
            var traits = possessions.filter(function (p) {
                return (p.element && p.element.kind === 'trait') || p.kind === 'trait';
            });
            if (traits.length === 0) {
                $traitsContainer.html('<div class="drawer-empty-msg" style="opacity: 0.6; font-size: 0.85em;">Sin rasgos registrados</div>');
            } else {
                traits.forEach(function (t) {
                    var el = t.element || t;
                    var name = el.name || 'Rasgo';
                    var desc = el.description || '';
                    $('<div></div>')
                        .addClass('drawer-trait-item')
                        .css({ marginBottom: '6px' })
                        .append($('<strong></strong>').text(name))
                        .append(desc ? $('<span></span>').css({ display: 'block', fontSize: '0.85em', opacity: '0.8' }).text(desc) : '')
                        .appendTo($traitsContainer);
                });
            }
        }

        // --- DEBILIDADES (NOMBRE Y DESCRIPCIÓN) ---
        var $weaknessesContainer = $('#drawer-weaknesses, #drawer-debilidades');
        if ($weaknessesContainer.length) {
            $weaknessesContainer.empty();
            var weaknesses = possessions.filter(function (p) {
                return (p.element && p.element.kind === 'weakness') || p.kind === 'weakness';
            });
            if (weaknesses.length === 0) {
                $weaknessesContainer.html('<div class="drawer-empty-msg" style="opacity: 0.6; font-size: 0.85em;">Sin debilidades registradas</div>');
            } else {
                weaknesses.forEach(function (w) {
                    var el = w.element || w;
                    var name = el.name || 'Debilidad';
                    var desc = el.description || '';
                    $('<div></div>')
                        .addClass('drawer-weakness-item')
                        .css({ marginBottom: '6px' })
                        .append($('<strong></strong>').css({ color: '#f87171' }).text(name))
                        .append(desc ? $('<span></span>').css({ display: 'block', fontSize: '0.85em', opacity: '0.8' }).text(desc) : '')
                        .appendTo($weaknessesContainer);
                });
            }
        }

        // --- HABILIDADES (NOMBRE Y NIVEL) ---
        var $skillsContainer = $('#drawer-skills, #drawer-habilidades');
        if ($skillsContainer.length) {
            $skillsContainer.empty();
            var skills = possessions.filter(function (p) {
                return (p.element && p.element.kind === 'skill') || p.kind === 'skill';
            });
            if (skills.length === 0) {
                $skillsContainer.html('<div class="drawer-empty-msg" style="opacity: 0.6; font-size: 0.85em;">Sin habilidades registradas</div>');
            } else {
                skills.forEach(function (s) {
                    var el = s.element || s;
                    var name = el.name || 'Habilidad';
                    var level = (s.possession && s.possession.quantity) || s.quantity || 1;
                    $('<div></div>')
                        .addClass('drawer-skill-item')
                        .css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' })
                        .append($('<strong></strong>').text(name))
                        .append($('<span></span>').css({ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75em' }).text('Nv. ' + level))
                        .appendTo($skillsContainer);
                });
            }
        }

        // --- TÉCNICAS DE COMBATE (NOMBRE, NIVEL, TIPO Y DESCRIPCIÓN) ---
        var $techsContainer = $('#drawer-techniques, #drawer-tecnicas');
        if ($techsContainer.length) {
            $techsContainer.empty();
            var techniques = Array.isArray(char.techniques) ? char.techniques : [];
            if (techniques.length === 0) {
                $techsContainer.html('<div class="drawer-empty-msg" style="opacity: 0.6; font-size: 0.85em;">Sin técnicas registradas</div>');
            } else {
                techniques.forEach(function (t) {
                    var name = t.name || 'Técnica';
                    var level = t.level || 1;
                    var cost = (t.cost !== undefined && t.cost !== null) ? t.cost : (t.staminaCost || t.ce || 0);
                    var classification = (t.classification || t.type || '').toUpperCase();
                    var desc = t.description || '';
                    var autoDesc = t.autoDescription || t.mechanicalDescription || '';

                    // Contenedor principal de la tarjeta
                    var $card = $('<div></div>').addClass('drawer-tech-card');

                    // 1. Fila superior: [ Nombre ] a la izquierda | [ Nivel X ] a la derecha
                    var $headerRow = $('<div class="drawer-tech-header"></div>')
                        .append($('<div class="tech-name"></div>').text(name))
                        .append(
                            $('<span></span>').addClass('drawer-tech-cost').text( cost + ' CE')
                        );
                    $card.append($headerRow);

                    var $badgesRow = $('<div></div>').addClass('drawer-tech-badges');

                   
                    if (classification) {
                        // Normaliza el texto a minúsculas y sin acentos para la clase (ej: "ofensivo", "hibrido")
                        var classSlug = classification
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .trim();

                        $badgesRow.append(
                            $('<span></span>')
                                .addClass('drawer-tech-classification tech-class-' + classSlug)
                                .text(classification)
                        );
                    }
                     if (cost !== undefined && cost !== null) {
                        $badgesRow.append(
                            $('<span></span>').addClass('drawer-tech-level').text('Técnica Nivel: ' + level)
                        );
                    }
                    $card.append($badgesRow);


                    // 4. Caja de Descripción Mecánica Generada
                    if (autoDesc) {
                        var $autoDescBox = $('<div></div>')
                            .addClass('drawer-tech-mechanical-box')
                            .css({ marginTop: '8px' })
                            .append(
                                $('<div></div>')
                                    .addClass('drawer-tech-mechanical-title')
                                    .text('DESCRIPCIÓN MECÁNICA:')
                            )
                            .append(
                                $('<div></div>')
                                    .addClass('drawer-tech-mechanical-text')
                                    .text(autoDesc)
                            );
                        $card.append($autoDescBox);
                    }

                    $card.appendTo($techsContainer);
                });
            }
        }

        // --- INVENTARIO / OBJETOS (NOMBRE, CANTIDAD, EQUIPADO Y DESCRIPCIÓN) ---
        var $invContainer = $('#drawer-inventory, #drawer-inventario');
        if ($invContainer.length) {
            $invContainer.empty();
            var invKinds = ['equipment', 'weapon', 'consumable', 'ammunition', 'crafting_material', 'ingredient', 'vehicle', 'real_estate'];
            var inventory = possessions.filter(function (p) {
                var k = (p.element && p.element.kind) || p.kind;
                return invKinds.includes(k);
            });
            if (inventory.length === 0) {
                $invContainer.html('<div class="drawer-empty-msg" style="opacity: 0.6; font-size: 0.85em;">Inventario vacío</div>');
            } else {
                inventory.forEach(function (item) {
                    var el = item.element || item;
                    var name = el.name || 'Objeto';
                    var qty = (item.possession && item.possession.quantity) || item.quantity || 1;
                    var isEquipped = (item.possession && item.possession.equipped === true) || item.equipped === true;
                    var desc = el.description || '';

                    var $itemRow = $('<div></div>').addClass('drawer-inv-item').css({ marginBottom: '6px' });
                    var $header = $('<div></div>').css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
                    var $nameSpan = $('<span></span>').append($('<strong></strong>').text(name));
                    if (qty > 1) $nameSpan.append(' <span style="opacity: 0.7; font-size: 0.85em;">(x' + qty + ')</span>');
                    if (isEquipped) $nameSpan.append(' <span style="color: #4ade80; font-size: 0.75em; font-weight: bold; margin-left: 4px;">[Equipado]</span>');

                    $header.append($nameSpan);
                    $itemRow.append($header);
                    if (desc) $itemRow.append($('<span></span>').css({ display: 'block', fontSize: '0.8em', opacity: '0.75', marginTop: '1px' }).text(desc));
                    $itemRow.appendTo($invContainer);
                });
            }
        }
    }

    // ========================================================
    // 3. APERTURA Y CARGA DESDE EL POST DE FOROACTIVO
    // ========================================================
 function cargarDatosEnDrawer(postId) {
    var numericId = postId.replace('p', '');
    var $postContainer = $('#' + postId).closest('.post-bigwrap');
    var $profile = $('#profile' + numericId);

    // 1. Extraer y aplicar colores del grupo al Drawer
    var groupStyle = $postContainer.attr('style');
    if (groupStyle) {
        $('#shadow-drawer').attr('style', groupStyle);
    }

    // 2. Extraer el nombre del personaje desde la cabecera visible del post
    var name = $postContainer.find('.topbarprf-name strong, .topbarprf-name a').first().text().trim();

    // Fallback de seguridad: buscar en el bloque de perfil oculto si no se encontró en la cabecera
    if (!name && $profile.length > 0) {
        name = $profile.find('.postprofile-name strong, .profile-name').text().trim();
    }

    // 3. Si se localizó el nombre, inyectar en el drawer y consultar la API
    if (name) {
        $('#drawer-char-name').text(name);
        $('#drawer-char-title').text(name);

        // ⚡ Consultar la API para inyectar todas las estadísticas en vivo
        cargarFichaDesdeAPI(name);
    }
}

    // Eventos de apertura
    $(document).on('click', '.open-shadow-drawer', function (e) {
        e.preventDefault();
        var postId = $(this).attr('data-post-id');
        cargarDatosEnDrawer(postId);
    });

    var primerPostId = $('.open-shadow-drawer').first().attr('data-post-id');
    if (primerPostId) {
        cargarDatosEnDrawer(primerPostId);
    }
});