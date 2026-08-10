/*
===========================================================
 Shadowmore Combat Engine
 Versión: 0.1
 Autor: Mercedes + ChatGPT
===========================================================
*/

(function ($) {

    "use strict";

    //////////////////////////////////////////////////////////
    // CONFIGURACIÓN
    //////////////////////////////////////////////////////////

    const ShadowCombat = {

        version: "0.1",

        debug: true,

        ready: false,

        csv: {

            url: "AQUI_VA_EL_CSV"

        },

        data: {

            personajes: {}

        }

    };

    // Exponer globalmente

    window.ShadowCombat = ShadowCombat;


    //////////////////////////////////////////////////////////
    // LOG
    //////////////////////////////////////////////////////////

    ShadowCombat.log = function () {

        if (!this.debug) return;

        console.log.apply(console, arguments);

    };


    //////////////////////////////////////////////////////////
    // PARSER CSV
    //////////////////////////////////////////////////////////

    ShadowCombat.parseCSV = function (text) {

        const rows = [];

        let row = [];

        let value = "";

        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {

            const c = text[i];

            if (c === '"') {

                if (inQuotes && text[i + 1] === '"') {

                    value += '"';

                    i++;

                } else {

                    inQuotes = !inQuotes;

                }

                continue;

            }

            if (c === "," && !inQuotes) {

                row.push(value);

                value = "";

                continue;

            }

            if ((c === "\n" || c === "\r") && !inQuotes) {

                if (c === "\r" && text[i + 1] === "\n") {

                    i++;

                }

                row.push(value);

                rows.push(row);

                row = [];

                value = "";

                continue;

            }

            value += c;

        }

        if (value.length || row.length) {

            row.push(value);

            rows.push(row);

        }

        return rows;

    };


    //////////////////////////////////////////////////////////
    // COLUMNAS DEL EXCEL
    //////////////////////////////////////////////////////////

    ShadowCombat.columns = {

        ok:0,

        nombre:1,

        edad:2,

        nivelQuirk:3,

        etapa:4,

        fueBase:5,
        resBase:6,
        desBase:7,
        intBase:8,
        velBase:9,
        volBase:10,

        hpBase:12,
        stBase:13,

        eva:14,
        cor:15,
        dañoBase:16,

        certificaciones:17,
        rasgos:18,
        debilidades:19,

        fueExtra:26,
        resExtra:27,
        desExtra:28,
        intExtra:29,
        velExtra:30,
        volExtra:31,

        fueRasgo:33,
        resRasgo:34,
        desRasgo:35,
        intRasgo:36,
        velRasgo:37,
        volRasgo:38,

        hpRasgo:39,
        stRasgo:40,

        plusUltra:41

    };


    //////////////////////////////////////////////////////////
    // CONVERSIÓN A NÚMERO
    //////////////////////////////////////////////////////////

    ShadowCombat.toNumber = function (value) {

        value = parseFloat(value);

        return isNaN(value) ? 0 : value;

    };


    //////////////////////////////////////////////////////////
    // CONSTRUIR PERSONAJE
    //////////////////////////////////////////////////////////

    ShadowCombat.buildCharacter = function (cols) {

        const c = this.columns;

        const num = this.toNumber;

        const personaje = {

            nombre: cols[c.nombre],

            edad: cols[c.edad],

            etapa: cols[c.etapa],

            nivelQuirk: cols[c.nivelQuirk],

            certificaciones: cols[c.certificaciones],

            rasgos: cols[c.rasgos],

            debilidades: cols[c.debilidades],

            fue:
                num(cols[c.fueBase]) +
                num(cols[c.fueExtra]) +
                num(cols[c.fueRasgo]),

            res:
                num(cols[c.resBase]) +
                num(cols[c.resExtra]) +
                num(cols[c.resRasgo]),

            des:
                num(cols[c.desBase]) +
                num(cols[c.desExtra]) +
                num(cols[c.desRasgo]),

            int:
                num(cols[c.intBase]) +
                num(cols[c.intExtra]) +
                num(cols[c.intRasgo]),

            vel:
                num(cols[c.velBase]) +
                num(cols[c.velExtra]) +
                num(cols[c.velRasgo]),

            vol:
                num(cols[c.volBase]) +
                num(cols[c.volExtra]) +
                num(cols[c.volRasgo]),

            hp:
                num(cols[c.hpBase]) +
                num(cols[c.hpRasgo]),

            st:
                num(cols[c.stBase]) +
                num(cols[c.stRasgo]),

            eva:
                num(cols[c.eva]),

            cor:
                num(cols[c.cor]),

            dañoBase:
                cols[c.dañoBase],

            plusUltra:
                num(cols[c.plusUltra])

        };

        return personaje;

    };


    //////////////////////////////////////////////////////////
    // CARGAR BASE DE DATOS
    //////////////////////////////////////////////////////////

    ShadowCombat.loadCharacters = function (rows) {

        this.data.personajes = {};

        for (let i = 1; i < rows.length; i++) {

            const cols = rows[i];

            if (!cols.length) continue;

            if (cols[this.columns.ok] !== "✅") continue;

            const pj = this.buildCharacter(cols);

            this.data.personajes[
                pj.nombre.toLowerCase()
            ] = pj;

        }

        this.log(

            "ShadowCombat:",

            Object.keys(this.data.personajes).length,

            "personajes cargados."

        );

    };

    ShadowCombat.data.personajes["izuku midoriya"]

{
    nombre:"Izuku Midoriya",

    hp:24,

    st:30,

    fue:11,

    res:9,

    des:13,

    int:10,

    vel:15,

    vol:12,

    eva:18,

    cor:8,

    dañoBase:"D6",

    plusUltra:2
}