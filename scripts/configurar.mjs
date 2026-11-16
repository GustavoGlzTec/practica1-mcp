#!/usr/bin/env node
// Genera el archivo de configuración MCP de la práctica con la ruta
// absoluta correcta de ESTA carpeta, para Windows, macOS o Linux.
//
// Uso (desde la carpeta practica1-mcp):
//   node scripts/configurar.mjs claude                 -> .mcp.json
//   node scripts/configurar.mjs antigravity            -> .agents/mcp_config.json
//   node scripts/configurar.mjs claude --memoria       -> agrega el servidor de la actividad D
//   node scripts/configurar.mjs claude --headless      -> playwright sin abrir ventana
//   node scripts/configurar.mjs claude --browser msedge  (o chromium) si no tienes Chrome

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const agente = (args.find((a) => !a.startsWith("--")) || "").toLowerCase();
const conMemoria = args.includes("--memoria");
const headless = args.includes("--headless");
const iBrowser = args.indexOf("--browser");
const browser = iBrowser >= 0 ? args[iBrowser + 1] : null;

if (!["claude", "antigravity"].includes(agente)) {
  console.error("Indica el agente: node scripts/configurar.mjs claude | antigravity [--memoria] [--headless] [--browser msedge|chromium]");
  process.exit(1);
}

// Carpeta raíz de la práctica = carpeta padre de /scripts
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const esWindows = process.platform === "win32";

// En Windows nativo npx debe lanzarse a través de "cmd /c"
function lanzador(paqueteYArgs) {
  return esWindows
    ? { command: "cmd", args: ["/c", "npx", "-y", ...paqueteYArgs] }
    : { command: "npx", args: ["-y", ...paqueteYArgs] };
}

const argsPlaywright = ["@playwright/mcp@latest"];
if (headless) argsPlaywright.push("--headless");
if (browser) argsPlaywright.push("--browser", browser);

const servidores = {
  filesystem: lanzador(["@modelcontextprotocol/server-filesystem", raiz]),
  playwright: lanzador(argsPlaywright),
};

if (conMemoria) {
  servidores.memory = {
    ...lanzador(["@modelcontextprotocol/server-memory"]),
    // El grafo se guarda dentro de la práctica para poder entregarlo como evidencia
    env: { MEMORY_FILE_PATH: path.join(raiz, "salida", "memoria.jsonl") },
  };
}

// Claude Code usa "type" y "env" explícitos (igual que lo genera "claude mcp add")
if (agente === "claude") {
  for (const [nombre, s] of Object.entries(servidores)) {
    servidores[nombre] = { type: "stdio", command: s.command, args: s.args, env: s.env || {} };
  }
}

const destino =
  agente === "claude"
    ? path.join(raiz, ".mcp.json")
    : path.join(raiz, ".agents", "mcp_config.json");

fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, JSON.stringify({ mcpServers: servidores }, null, 2) + "\n", "utf8");

console.log(`✔ Configuración escrita en: ${path.relative(raiz, destino)}`);
console.log(`  Sistema: ${esWindows ? "Windows (usa cmd /c npx)" : process.platform + " (usa npx directo)"}`);
console.log(`  Carpeta permitida para filesystem: ${raiz}`);
console.log(`  Servidores: ${Object.keys(servidores).join(", ")}`);

const otro =
  agente === "claude"
    ? path.join(raiz, ".agents", "mcp_config.json")
    : path.join(raiz, ".mcp.json");
if (fs.existsSync(otro)) {
  console.log(`\n⚠ También existe ${path.relative(raiz, otro)}. La rúbrica pide incluir SOLO el del agente que usaste: bórralo antes de entregar.`);
}

console.log(
  agente === "claude"
    ? "\nSiguiente paso: ejecuta  claude  en esta carpeta, aprueba los servidores y escribe  /mcp"
    : "\nSiguiente paso: en Antigravity abre MCP Servers y recarga (o reinicia la app)."
);
