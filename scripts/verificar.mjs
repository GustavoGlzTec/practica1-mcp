#!/usr/bin/env node
// Revisa que los archivos que generó el agente y la estructura del repositorio
// cumplan con lo que pide la práctica. NO genera nada: solo comprueba.
//
// Uso (desde la carpeta practica1-mcp):  node scripts/verificar.mjs

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...r) => path.join(raiz, ...r);
let errores = 0, avisos = 0;
const ok = (m) => console.log("  ✔ " + m);
const mal = (m) => { errores++; console.log("  ✘ " + m); };
const ojo = (m) => { avisos++; console.log("  ⚠ " + m); };
const leer = (f) => fs.readFileSync(f, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");

// ---------- Estructura ----------
console.log("\n[Estructura del repositorio]");
for (const f of ["README.md", ".gitignore", "datos/calificaciones.csv"]) {
  fs.existsSync(p(f)) ? ok(f) : mal(`Falta ${f}`);
}
const tieneClaude = fs.existsSync(p(".mcp.json"));
const tieneAg = fs.existsSync(p(".agents", "mcp_config.json"));
if (tieneClaude && tieneAg) mal("Hay .mcp.json Y .agents/mcp_config.json: deja solo el del agente que usaste");
else if (!tieneClaude && !tieneAg) mal("No hay archivo de configuración MCP (corre scripts/configurar.mjs)");
else {
  const cfgPath = tieneClaude ? p(".mcp.json") : p(".agents", "mcp_config.json");
  try {
    const cfg = JSON.parse(leer(cfgPath));
    const nombres = Object.keys(cfg.mcpServers || {});
    ok(`${path.relative(raiz, cfgPath)} válido; servidores: ${nombres.join(", ")}`);
    for (const n of ["filesystem", "playwright"]) if (!nombres.includes(n)) mal(`Falta el servidor ${n}`);
    const fsArgs = cfg.mcpServers.filesystem?.args || [];
    const rutaFs = fsArgs[fsArgs.length - 1];
    if (rutaFs && !rutaFs.includes("TU_USUARIO") && path.resolve(rutaFs) !== raiz)
      ojo(`filesystem apunta a ${rutaFs}, pero esta carpeta es ${raiz}. Corre de nuevo scripts/configurar.mjs`);
  } catch (e) { mal("El JSON de configuración no es válido: " + e.message); }
}
if (!leer(p(".gitignore")).includes(".playwright-mcp/")) mal(".gitignore debe contener .playwright-mcp/");
for (const l of ["a", "b", "c", "d"]) {
  fs.existsSync(p("instrucciones", `actividad_${l}.txt`)) ? ok(`instrucciones/actividad_${l}.txt`) : mal(`Falta instrucciones/actividad_${l}.txt`);
}
const imgs = fs.existsSync(p("evidencias")) ? fs.readdirSync(p("evidencias")).filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f)) : [];
imgs.length >= 5 ? ok(`evidencias/ tiene ${imgs.length} imágenes`) : ojo(`evidencias/ tiene ${imgs.length} imágenes (se esperan al menos: configuración + una por actividad)`);

// ---------- Actividad A ----------
console.log("\n[Actividad A: salida/reporte.md]");
if (!fs.existsSync(p("salida", "reporte.md"))) mal("No existe salida/reporte.md (lo crea el agente en la actividad A)");
else {
  const rep = leer(p("salida", "reporte.md"));
  const filas = leer(p("datos", "calificaciones.csv")).trim().split("\n").slice(1).map((l) => {
    const [m, n, a, b, c] = l.split(",");
    return { m, n, prom: Math.round(((+a + +b + +c) / 3) * 100 + 1e-9) / 100 };
  });
  let todos = true;
  for (const f of filas) {
    const linea = rep.split("\n").find((l) => l.includes(f.n));
    if (!linea) { mal(`No aparece ${f.n}`); todos = false; continue; }
    if (!linea.includes(f.prom.toFixed(2))) { mal(`${f.n}: se esperaba promedio ${f.prom.toFixed(2)}`); todos = false; }
    const noAprueba = /no aprueba|reprueba|no$|✘|❌/i.test(linea);
    if (f.prom < 6 && !noAprueba) { mal(`${f.n} (${f.prom.toFixed(2)}) debería marcarse como NO aprueba`); todos = false; }
  }
  if (todos) ok("Los 8 alumnos con promedio correcto (Diego 5.50 y Hector 5.33 no aprueban)");
  /7\.50/.test(rep) ? ok("Promedio del grupo 7.50") : mal("No se encontró el promedio del grupo 7.50");
  const orden = filas.map((f) => ({ ...f, pos: rep.indexOf(f.n) })).sort((x, y) => x.pos - y.pos);
  orden.every((f, i) => i === 0 || orden[i - 1].prom >= f.prom) ? ok("Ordenado de mayor a menor") : mal("La tabla no está ordenada de mayor a menor promedio");
}

// ---------- Actividad B ----------
console.log("\n[Actividad B: salida/entidades.csv]");
if (!fs.existsSync(p("salida", "entidades.csv"))) mal("No existe salida/entidades.csv (lo crea el agente en la actividad B)");
else {
  const lineas = leer(p("salida", "entidades.csv")).trim().split("\n");
  lineas[0].trim() === "entidad,superficie_km2,poblacion,densidad_hab_km2" ? ok("Encabezado correcto") : mal(`Encabezado incorrecto: ${lineas[0]}`);
  const datos = lineas.slice(1).map((l) => {
    // admite entidades entre comillas por si el nombre trae coma
    const m = l.match(/^("?)(.*?)\1,([^,]+),([^,]+),([^,]+)$/);
    return m ? { e: m[2], s: m[3], p: m[4], d: m[5] } : { raw: l };
  });
  datos.length === 32 ? ok("32 filas de datos") : mal(`Hay ${datos.length} filas; deben ser 32`);
  const malas = datos.filter((r) => r.raw || ![r.s, r.p, r.d].every((v) => /^\d+(\.\d+)?$/.test(v.trim())));
  malas.length === 0 ? ok("Todos los números sin separadores de miles y con punto decimal") : mal(`Filas con formato numérico inválido: ${malas.map((r) => r.e || r.raw).join(" | ")}`);
  const pri = datos[0] || {};
  pri.e?.includes("Chihuahua") && Math.round(+pri.s) === 247455 ? ok("Primera fila: Chihuahua, 247455 km2") : mal(`La primera fila debería ser Chihuahua con 247455 km2 (está: ${pri.e}, ${pri.s})`);
  const pobTotal = datos.reduce((t, r) => t + (+r.p || 0), 0);
  pobTotal > 110e6 && pobTotal < 140e6 ? ok(`Población total ${pobTotal.toLocaleString("es-MX")} (cifra razonable para México)`) : ojo(`Población total ${pobTotal.toLocaleString("es-MX")}: revisa si el agente tomó la columna correcta`);
  const sospechosas = datos.filter((r) => +r.s > 0 && +r.d > 0 && Math.abs(+r.p / +r.s / +r.d - 1) > 0.35);
  sospechosas.length === 0 ? ok("La densidad es coherente con población/superficie en todas las filas") : ojo(`Densidad poco coherente en: ${sospechosas.map((r) => r.e).join(", ")} (verifícalas en la página)`);
  if (datos.length >= 3) {
    const idx = [0, Math.floor(datos.length / 2), datos.length - 1];
    console.log("    Filas sugeridas para tu verificación manual contra Wikipedia:");
    for (const i of idx) console.log(`      - ${datos[i].e}: ${datos[i].s} km2, ${datos[i].p} hab, ${datos[i].d} hab/km2`);
  }
}

// ---------- Actividad D ----------
console.log("\n[Actividad D]");
fs.existsSync(p("salida", "memoria.jsonl"))
  ? ok("salida/memoria.jsonl existe (grafo del servidor memory)")
  : ojo("No existe salida/memoria.jsonl (solo aplica si usaste el servidor memory con scripts/configurar.mjs --memoria)");

// ---------- README ----------
console.log("\n[README.md]");
if (fs.existsSync(p("README.md"))) {
  const readme = leer(p("README.md"));
  const pendientes = (readme.match(/✏️/g) || []).length;
  pendientes === 0 ? ok("Sin marcas ✏️ pendientes") : mal(`Quedan ${pendientes} marcas ✏️ por completar en el README`);
  const secciones = ["Descripción", "Requisitos y reproducción", "Servidores MCP", "Actividad A", "Actividad B", "Actividad C", "Actividad D", "Problemas encontrados", "Fuentes"];
  const faltan = secciones.filter((s) => !readme.includes(s));
  faltan.length === 0 ? ok("Tiene todas las secciones en el README") : mal(`Faltan secciones: ${faltan.join(", ")}`);
  const refs = [...readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  const rotas = refs.filter((r) => !/^https?:/.test(r) && !fs.existsSync(p(decodeURI(r))));
  rotas.length === 0 ? ok(`${refs.length} imágenes referenciadas, todas existen`) : mal(`Imágenes que no existen (revisa nombre y mayúsculas): ${rotas.join(", ")}`);
  if (/(sk-[A-Za-z0-9]{10,}|ghp_[A-Za-z0-9]{10,}|AIza[0-9A-Za-z_-]{20,})/.test(readme)) mal("¡El README parece contener una clave o token! Quítalo.");
}

// ---------- Git ----------
console.log("\n[Git]");
try {
  const log = execSync("git log --oneline", { cwd: raiz, stdio: ["ignore", "pipe", "ignore"] }).toString().trim().split("\n").filter(Boolean);
  log.length >= 6 ? ok(`${log.length} commits`) : ojo(`${log.length} commits: se espera al menos uno inicial + uno por actividad (A, B, C, D) + README`);
  const remoto = execSync("git remote -v", { cwd: raiz, stdio: ["ignore", "pipe", "ignore"] }).toString();
  remoto.includes("github.com") ? ok("Remoto de GitHub configurado") : ojo("Aún no hay remoto de GitHub (sección 10.3 de la guía)");
} catch { ojo("Esta carpeta todavía no es un repositorio de Git (git init)"); }

console.log(`\nResultado: ${errores} error(es), ${avisos} aviso(s).` + (errores === 0 ? " ¡Listo para entregar!" : ""));
process.exit(errores ? 1 : 0);
