# Práctica 1 · Conectar servidores MCP a un agente

> ✏️ **Antes de entregar:** busca todas las marcas ✏️ de este archivo, complétalas con lo que tú observaste y bórralas. `node scripts/verificar.mjs` te avisa si queda alguna.

## 1. Descripción

En esta práctica conecté dos servidores del **Model Context Protocol (MCP)** a un agente de programación y resolví con ellos tareas que combinan archivos locales y navegación web. MCP es un protocolo abierto que estandariza cómo una aplicación de IA (el *host*) se conecta con programas externos (los *servidores*) que le ofrecen herramientas. En la arquitectura:

| Papel | En esta práctica |
|---|---|
| **Host** | ✏️ Claude Code / Google Antigravity (deja solo el que usaste) |
| **Cliente MCP** | Uno por servidor, dentro del host; habla JSON-RPC 2.0 por **stdio** |
| **Servidores MCP** | `filesystem`, `playwright` y, en la actividad D, `memory` |

| Dato | Valor |
|---|---|
| Agente | ✏️ nombre y versión (Claude Code: `claude --version`; Antigravity: menú *About*) |
| Modelo | ✏️ por ejemplo claude-sonnet-5-5 / Gemini … |
| Sistema operativo | ✏️ Windows 11 / macOS / Linux |
| Node.js | ✏️ salida de `node --version` |
| Fecha de ejecución | ✏️ |

## 2. Requisitos y reproducción

### Requisitos

- **Node.js 18 o superior** (incluye `npx`, que descarga y ejecuta los servidores): <https://nodejs.org>
- **Google Chrome** (lo usa `playwright`). Sin Chrome: usa `--browser msedge` o `--browser chromium` (ver abajo).
- **Git** y una cuenta de **GitHub**.
- Un agente: **Claude Code** (requiere suscripción o crédito de API) o **Google Antigravity**.
- Conexión a internet.

Comprobación:

```bash
node --version
npx --version
git --version
```

### Pasos para repetir la práctica desde cero

1. Clona el repositorio y entra a la carpeta:
   ```bash
   git clone https://github.com/✏️TU_USUARIO/practica1-mcp.git
   cd practica1-mcp
   ```
2. **Cambia la ruta de la configuración a la de tu equipo.** El archivo de configuración contiene la ruta absoluta de mi carpeta, que en tu equipo no existe. Regenéralo con el script incluido (detecta tu sistema operativo y escribe la ruta correcta):
   ```bash
   node scripts/configurar.mjs claude            # genera .mcp.json para Claude Code
   node scripts/configurar.mjs antigravity       # o .agents/mcp_config.json para Antigravity
   ```
   Opciones: `--memoria` agrega el servidor de la actividad D, `--headless` evita que se abra la ventana del navegador y `--browser msedge` usa Edge en lugar de Chrome.
   Si prefieres hacerlo a mano, abre el archivo y cambia la ruta que aparece después de `@modelcontextprotocol/server-filesystem` por la ruta absoluta de tu carpeta (en Windows, con barras invertidas dobles: `C:\\Users\\...`).
3. Inicia el agente en la carpeta:
   - **Claude Code:** ejecuta `claude`, aprueba los servidores del proyecto y escribe `/mcp`.
   - **Antigravity:** abre la carpeta, ve a *MCP Servers* y recarga.
4. Copia en el chat del agente, una por una, las instrucciones de la carpeta [`instrucciones/`](instrucciones/) y aprueba cada llamada a herramienta.
5. Comprueba los resultados con:
   ```bash
   node scripts/verificar.mjs
   ```

### Estructura

```
practica1-mcp/
  README.md
  .gitignore                 (excluye .playwright-mcp/, archivos temporales del navegador)
  ✏️ .mcp.json  o  .agents/mcp_config.json   (deja solo el que usaste)
  datos/calificaciones.csv
  salida/reporte.md · salida/entidades.csv · salida/memoria.jsonl
  instrucciones/actividad_a.txt … actividad_d.txt
  evidencias/                (capturas de pantalla)
  scripts/configurar.mjs     (genera la configuración con la ruta correcta)
  scripts/verificar.mjs      (comprueba los resultados)
```

## 3. Servidores MCP

| Servidor | Paquete npm | Publica | Qué permite |
|---|---|---|---|
| `filesystem` | `@modelcontextprotocol/server-filesystem` | Mantenedores del protocolo MCP | Leer, escribir, listar y buscar archivos **solo** dentro de la carpeta indicada al arrancarlo |
| `playwright` | `@playwright/mcp` | Microsoft | Controlar un navegador: abrir páginas, leer su contenido, hacer clic, ejecutar JavaScript, tomar capturas |

**Cómo los configuré:** ✏️ elige una y borra la otra:
- *Claude Code:* con `claude mcp add --scope project …` (sección 6.1 de la guía) / con `node scripts/configurar.mjs claude`, que produce el mismo `.mcp.json`.
- *Antigravity:* escribiendo `.agents/mcp_config.json` (sección 7.2 de la guía) / con `node scripts/configurar.mjs antigravity`.

Ambos se ejecutan con `npx -y` (en Windows, a través de `cmd /c npx`), por transporte **stdio**: el host los lanza como procesos hijos. A `filesystem` se le pasa como argumento la ruta de la carpeta de la práctica, que es el **único** directorio al que tiene acceso.

**Herramientas que expone cada uno** (copiadas de `/mcp` o de la pantalla de servidores del agente):

- `filesystem` (✏️ número de herramientas que te mostró el agente): `read_text_file`, `read_media_file`, `read_multiple_files`, `write_file`, `edit_file`, `create_directory`, `list_directory`, `list_directory_with_sizes`, `directory_tree`, `move_file`, `search_files`, `get_file_info`, `list_allowed_directories`, … ✏️ completa con las que veas en tu versión.
- `playwright` (✏️ número): `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_evaluate`, `browser_take_screenshot`, `browser_wait_for`, `browser_tabs`, `browser_close`, … ✏️ completa con las que veas en tu versión.

![Servidores conectados](evidencias/01_servidores.png)
![Herramientas de filesystem](evidencias/02_herramientas_filesystem.png)
![Herramientas de playwright](evidencias/03_herramientas_playwright.png)

## 4. Actividades A, B y C

En Claude Code las herramientas MCP aparecen como `mcp__servidor__herramienta` (por ejemplo `mcp__filesystem__read_text_file`). En cada llamada registré el nombre de la herramienta, los argumentos y el resultado.

### Actividad A · Lectura y escritura de archivos

**Servidor:** `filesystem` · **Instrucción:** [`instrucciones/actividad_a.txt`](instrucciones/actividad_a.txt)

**Herramientas que usó el agente, en orden:**

| # | Herramienta | Argumentos | Resultado |
|---|---|---|---|
| 1 | ✏️ `list_directory` | ✏️ `datos` | ✏️ `[FILE] calificaciones.csv` |
| 2 | ✏️ `read_text_file` | ✏️ `datos/calificaciones.csv` | ✏️ contenido del CSV |
| 3 | ✏️ `write_file` | ✏️ `salida/reporte.md` | ✏️ `Successfully wrote to …` |

✏️ *Si tu agente hizo pasos distintos (por ejemplo, `list_allowed_directories` al inicio o `create_directory`), anótalos tal cual.*

**Resultado:** [`salida/reporte.md`](salida/reporte.md) contiene a los 8 alumnos ordenados de mayor a menor promedio. Aprueban 6 y no aprueban 2: Diego Ruiz (5.50) y Hector Vega (5.33). El promedio del grupo es **7.50**. ✏️ confirma que tu archivo coincide.

![Actividad A: llamadas a herramientas](evidencias/04_actividad_a.png)

### Actividad B · De una página web a un CSV

**Servidores:** `playwright` y `filesystem` · **Instrucción:** [`instrucciones/actividad_b.txt`](instrucciones/actividad_b.txt)

**Herramientas que usó el agente, en orden:**

| # | Servidor | Herramienta | Qué hizo |
|---|---|---|---|
| 1 | playwright | ✏️ `browser_navigate` | ✏️ Abrió la página de Wikipedia |
| 2 | playwright | ✏️ `browser_evaluate` / `browser_snapshot` | ✏️ … |
| … | … | ✏️ | ✏️ agrega una fila por llamada |
| ✏️ | filesystem | ✏️ `write_file` | ✏️ Escribió `salida/entidades.csv` |
| ✏️ | playwright | ✏️ `browser_take_screenshot` | ✏️ Tomó la captura |
| ✏️ | playwright | ✏️ `browser_close` | ✏️ Cerró el navegador |

**Cambio de servidor:** el agente pasó de `playwright` a `filesystem` en el paso ✏️ #, cuando ya tenía los datos extraídos y necesitaba escribirlos en disco; `playwright` no puede escribir en la carpeta de la práctica, así que esa parte solo la podía hacer `filesystem`.

**Cómo obtuvo los datos:** ✏️ elige: *ejecutando JavaScript* con `browser_evaluate` (leyó las celdas de la tabla directamente del DOM) / *leyendo la página* con `browser_snapshot` (el árbol de accesibilidad de la página).

**Resultado:** [`salida/entidades.csv`](salida/entidades.csv) con un encabezado y 32 filas; la primera es Chihuahua con 247455 km². Según el agente, la población corresponde al año ✏️ y la densidad está rotulada como ✏️.

**Verificación manual de tres filas contra la página:**

| Entidad | Superficie (CSV / página) | Población (CSV / página) | Densidad (CSV / página) | ¿Coincide? |
|---|---|---|---|---|
| ✏️ Chihuahua | ✏️ / ✏️ | ✏️ / ✏️ | ✏️ / ✏️ | ✏️ |
| ✏️ | ✏️ / ✏️ | ✏️ / ✏️ | ✏️ / ✏️ | ✏️ |
| ✏️ | ✏️ / ✏️ | ✏️ / ✏️ | ✏️ / ✏️ | ✏️ |

![Actividad B: llamadas a herramientas](evidencias/05_actividad_b.png)
![Actividad B: captura tomada por playwright](evidencias/06_actividad_b_captura_pagina.png)

### Actividad C · Los límites del servidor

**Servidor:** `filesystem` · **Instrucción:** [`instrucciones/actividad_c.txt`](instrucciones/actividad_c.txt)

| # | Herramienta | Respuesta textual del servidor |
|---|---|---|
| 1 | `list_allowed_directories` | ✏️ `Allowed directories: …` |
| 2 | `read_text_file` | ✏️ `Access denied - path outside allowed directories: … not in …` |
| 3 | `list_directory` | ✏️ `Access denied - path outside allowed directories: … not in …` |

**¿Quién impuso el límite?** El **servidor**. El modelo sí intentó leer el archivo y listar el directorio padre (las llamadas aparecen en el registro), y el host las transmitió; fue el proceso `filesystem` el que comparó cada ruta con la lista de directorios permitidos que recibió como argumento al arrancar y rechazó las que quedaban fuera. Por eso el límite no depende de que el modelo "obedezca" una instrucción: aunque un prompt le pidiera leer `/etc/hosts` o `C:\Windows\win.ini`, el servidor seguiría negándose.

![Actividad C: accesos denegados](evidencias/07_actividad_c.png)

## 5. Actividad D · Un tercer servidor: `memory`

| Dato | Valor |
|---|---|
| Servidor | `memory` (Knowledge Graph Memory Server) |
| Paquete | `@modelcontextprotocol/server-memory` |
| Quién lo publica | La organización `modelcontextprotocol` en GitHub y npm, los mismos mantenedores del protocolo que publican `filesystem` |
| Código fuente | <https://github.com/modelcontextprotocol/servers/tree/main/src/memory> |
| Configuración | `node scripts/configurar.mjs ✏️claude --memoria`, que agrega la entrada `memory` con la variable `MEMORY_FILE_PATH` apuntando a `salida/memoria.jsonl` |

**Herramientas que expone:** `create_entities`, `create_relations`, `add_observations`, `delete_entities`, `delete_observations`, `delete_relations`, `read_graph`, `search_nodes`, `open_nodes`. ✏️ confirma con `/mcp`.

**Tarea que diseñé:** convertir los resultados de la actividad A en un grafo de conocimiento (un nodo por alumno, un nodo para el grupo y relaciones `pertenece_a`) y después consultarlo con búsquedas, en lugar de volver a leer el CSV. Combina `filesystem` (leer los datos) con `memory` (guardarlos y consultarlos). Instrucción: [`instrucciones/actividad_d.txt`](instrucciones/actividad_d.txt).

**Secuencia de herramientas:** ✏️ por ejemplo `read_text_file` ×2 → `create_entities` → `create_relations` → `search_nodes` → `open_nodes` → `read_graph`.

**Resultado:** ✏️ `search_nodes("No aprueba")` devolvió a Diego_Ruiz y Hector_Vega; `open_nodes` mostró que Carla_Mendez y Gabriela_Luna tienen ambas 9.50; `read_graph` reportó 9 entidades y 8 relaciones. El grafo quedó guardado en [`salida/memoria.jsonl`](salida/memoria.jsonl).

**Por qué lo considero confiable:**
- Lo publican los mantenedores oficiales del protocolo, en el mismo repositorio que `filesystem`; el código es abierto y se puede revisar.
- Trabaja solo en local: guarda el grafo en un archivo JSONL cuya ruta yo elijo y no se conecta a internet.
- No necesita claves ni tokens, así que no hay credenciales que puedan filtrarse en el repositorio.
- Sus herramientas solo modifican su propio archivo de memoria; no puede leer ni borrar otros archivos del equipo.

![Actividad D](evidencias/08_actividad_d.png)

## 6. Problemas encontrados

✏️ Describe lo que te pasó. Ejemplos de cómo redactarlo:
- *La primera llamada tardó casi un minuto:* era `npx` descargando el paquete; las siguientes fueron inmediatas.
- *El agente intentó leer el archivo con su herramienta propia en lugar de MCP:* repetí la instrucción indicando explícitamente que usara el servidor MCP `filesystem`.
- *En la actividad B el agente eligió primero una tabla histórica:* lo corrigió en la siguiente llamada / se lo indiqué.

Si nada falló, lo que verifiqué para estar segura:
- `/mcp` mostraba los servidores como conectados (captura 01).
- `node scripts/verificar.mjs` confirmó los 8 promedios, el promedio del grupo 7.50, las 32 filas del CSV y el formato numérico.
- Comparé tres filas de `entidades.csv` contra Wikipedia (tabla de la actividad B).

## 7. Fuentes

- Wikipedia. *Anexo:Entidades federativas de México por superficie, población y densidad*. <https://es.wikipedia.org/?curid=5897912> (consultado el ✏️ fecha). Origen de los datos de `salida/entidades.csv`.
- Model Context Protocol, documentación oficial: <https://modelcontextprotocol.io>
- MCP en Claude Code: <https://code.claude.com/docs/en/mcp>
- MCP en Google Antigravity: <https://antigravity.google/docs/mcp>
- Servidores `filesystem` y `memory`: <https://github.com/modelcontextprotocol/servers>
- Servidor `playwright`: <https://github.com/microsoft/playwright-mcp>
- Registro oficial de servidores MCP: <https://registry.modelcontextprotocol.io>
