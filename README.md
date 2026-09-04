<div align="center">

<img src="frontend/public/logo-icon.svg" width="96" alt="ProspectOS logo" />

# ProspectOS (fork en español — adaptado para PresencIA)

### Prospección de leads en piloto automático: de Google Maps e Instagram directo a tu CRM

Encontrá negocios chicos locales **sin web o con web mala**, recibí la estrategia
de abordaje y el mensaje listos por IA, generá un diagnóstico en PDF y seguí todo
en un CRM visual — desde el primer contacto hasta el cierre.

> 🇦🇷 **Este es un fork traducido al español rioplatense** del original
> [nando0x/ProspectOS](https://github.com/nando0x/ProspectOS) (en portugués),
> adaptado para prospectar clientes de **[PresencIA](https://presenciaia.com.ar)**
> (automatización de atención por WhatsApp) en vez de venta de sitios web. La
> lógica y el stack son los mismos; lo que cambió es el idioma de toda la
> interfaz y de los mensajes generados por IA, el catálogo de rubros (términos
> de búsqueda en español rioplatense) y el idioma/región del scraper de Google
> Maps (`es` / `AR` en vez de `pt` / `BR`). Detalle completo de la adaptación
> en el historial de commits.

![Version](https://img.shields.io/badge/version-2.0.0-107a4a)
![Tests](https://img.shields.io/badge/tests-375%20passing-22c55e)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

[![GitHub stars](https://img.shields.io/github/stars/fraancogodoy/ProspectOS?style=social)](https://github.com/fraancogodoy/ProspectOS)

<img src="https://res.cloudinary.com/doqqbpc2u/image/upload/v1783540529/ProspecOS_Print_pfnrc9.png" alt="Dashboard de ProspectOS" width="800" />

</div>

---

## 📋 Índice

- [Qué es](#-qué-es)
- [⚠️ Antes de usar](#️-antes-de-usar)
- [Features](#-features)
- [Instalación rápida](#-instalación-rápida)
- [Uso del día a día](#-uso-del-día-a-día)
- [Stack](#-stack)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Filosofía del proyecto](#-filosofía-del-proyecto)
- [Preguntas frecuentes](#-preguntas-frecuentes)
- [Este fork vs. el original](#-este-fork-vs-el-original)
- [Licencia](#-licencia)
- [Agradecimientos](#-agradecimientos)

---

## 🎯 Qué es

**ProspectOS** es una herramienta de prospección de leads para quien vende un servicio digital a negocios chicos locales — en este fork, pensada para **PresencIA** (automatización de atención por WhatsApp para peluquerías, canchas, inmobiliarias y comercios similares).

Resuelve un problema puntual de punta a punta: encontrar negocios que **necesitan digitalizar su atención** y transformarlos en conversaciones de venta. ProspectOS recorre **Google Maps** (por rubro + ciudad, o por pin y radio en un mapa) y los **comentarios de posts de Instagram**, **analiza la web de cada negocio** para separar quién no tiene web de quién la tiene mala/lenta/insegura, prioriza por un score, y para cada lead entrega la **estrategia de abordaje**, el **mensaje listo por IA** y un **diagnóstico en PDF** para mandar por WhatsApp — todo en un CRM visual con embudo, seguimiento y analytics.

**Para quién es:**
- Vendedores o agencias que hacen su propia prospección de comercios locales
- Devs que quieren estudiar scraping, integración con IA y un CRM full-stack en la práctica
- Cualquiera con curiosidad por automatizar la generación de leads locales

> 💡 Sigue siendo software que corrés localmente, en tu máquina, por tu cuenta y riesgo — no es un SaaS armado. Leé los avisos de abajo antes de correr nada.

---

## ⚠️ Antes de usar

Leé esto con atención antes de correr cualquier cosa:

- 🕷️ **Esto es una herramienta de scraping.** Raspar Google Maps e Instagram puede violar los Términos de Uso de esas plataformas. Usalo por tu cuenta y riesgo.
- 📸 **El módulo de Instagram usa tu cuenta personal** (vía [instagrapi](https://github.com/subzeroid/instagrapi)) para loguearse y consultar datos. Esto puede resultar en **checkpoint de seguridad o baneo temporal/permanente de la cuenta**. Recomendado: usá una cuenta secundaria, corré con moderación, y nunca compartas el archivo de sesión generado.
- 💬 **El cockpit de conversación lee la ventana de WhatsApp Web de la app.** La lectura es **pasiva** (sólo observa el chat que *vos* abriste, nunca navega ni recorre conversaciones) y **ningún mensaje se envía automáticamente** — vos siempre revisás y enviás. Aun así, automatizar WhatsApp Web va contra los Términos de Uso de Meta y trae **riesgo de bloqueo de tu número**. No existe una implementación "indetectable": quien lo promete miente. Si preferís riesgo cero, el cockpit funciona 100% en modo manual (pegás los mensajes vos), incluso en el navegador, sin la app de escritorio.
- 🔧 **Sin garantía de funcionamiento continuo.** Instagram y Google cambian sus protecciones seguido. Si algo deja de andar, es probablemente por eso.
- 🚫 **Sin afiliación** con Google, Meta/Instagram, ni con los proyectos de terceros usados (`gosom/google-maps-scraper`, `instagrapi`).
- 📄 Provisto **"tal cual"**, sin garantías. Ver [`LICENSE`](LICENSE) (MIT).
- 🪟 **Sólo Windows.** Los scripts de conveniencia (`.bat`) y el binario del scraper de Maps son específicos de esa plataforma.

---

## ✨ Features

| Área | Qué hace |
|---|---|
| 🗺️ **Canal Google Maps** | Busca por rubro + ciudad **o por pin y radio en un mapa** (estilo segmentación de Facebook Ads), con catálogo de 170+ rubros clicables (en español rioplatense) |
| 🔎 **Análisis de web real** | Abre la web de cada negocio y detecta **sin web, web caída, sin HTTPS, SSL inválido, no-mobile, lenta o hecha en un constructor genérico** (Wix, Canva...) — web mala también es lead |
| 🩻 **Radiografía de la web** | Extrae del HTML lo que la web **tiene y lo que falta** (WhatsApp, teléfono, e-mail, mapa, fotos, meta description, favicon) — dato real, no chamuyo |
| 📄 **Diagnóstico en PDF** | Informe de una página listo para mandar por WhatsApp: reputación, problemas en criollo, radiografía y **nota oficial de Google PageSpeed** |
| 📸 **Canal Instagram** | Extrae comentarios de un post, enriquece el perfil de cada autor y clasifica prioridad con IA, con retomada de análisis interrumpidos |
| 🧠 **Mensajes con IA** | Copy de abordaje y seguimiento **con tu voz** (perfil de vendedor), citando detalles reales de la web, con fallback entre 3 proveedores gratuitos (Gemini, Groq, NVIDIA) |
| 🎯 **Estrategia por lead** | Cada lead trae escenario detectado, ángulo de venta, ganchos concretos y objeciones con respuestas listas |
| 🔥 **Score de priorización** | Puntuación + volumen de reseñas + situación de la web en un score 0-100 para ordenar la cola de abordaje |
| ⚡ **Sesión de prospección** | Modo foco: un lead por vez del más caliente al más frío (seguimientos primero), abordaje en un clic con atajos de teclado |
| 📋 **Tareas de hoy** | Seguimientos vencidos + leads calientes, cada uno con el WhatsApp ya cargado |
| 📊 **CRM visual + Kanban** | Embudo de estados con historial, drag-and-drop, etiquetas, notas y seguimiento con cadencia creciente (+3/+5/+7 días) |
| 📈 **Analytics** | Embudo de conversión y desempeño por rubro, para los dos canales separados y combinados |
| 🧰 **Productividad** | Filtros (incluida la situación de la web), historial de búsquedas, búsqueda global (Ctrl+K), exportación CSV, acciones en lote, tema claro/oscuro |
| 🔐 **Seguridad** | Claves de API guardadas en el cofre de credenciales del sistema (Windows/DPAPI), nunca en texto plano |

---

## 🚀 Instalación rápida

### Requisitos previos

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/)
- Windows (los scripts `.bat` y el scraper de Maps son específicos de esta plataforma)

### 1. Cloná el repositorio

```powershell
git clone https://github.com/fraancogodoy/ProspectOS.git
cd ProspectOS
```

### 2. Configurá el backend

```powershell
cd backend
py -m pip install -r requirements.txt
copy .env.example .env
```

Vas a necesitar **al menos una** clave de IA gratuita (se usa para generar los mensajes de abordaje y clasificar leads de Instagram):

| Proveedor | Dónde conseguir la clave |
|---|---|
| Gemini | https://aistudio.google.com/apikey |
| Groq | https://console.groq.com/keys |
| NVIDIA Build | https://build.nvidia.com |

Hay dos formas de configurarla, elegí la que te resulte más fácil:

- **Desde la interfaz del sistema (más fácil):** después de correr el proyecto (ver paso 6), entrá a **Configuración** en el menú y pegá la clave ahí directo. Queda guardada de forma segura en el cofre de credenciales del sistema (nunca en texto plano), sin tocar ningún archivo ni reiniciar el servidor.
- **Editando el `.env` a mano:** abrí el archivo `backend/.env` en un editor de texto y completá el valor de la clave correspondiente (`GEMINI_API_KEY`, `GROQ_API_KEY` o `NVIDIA_API_KEY`).

> Si lo configurás de las dos formas, lo guardado desde la interfaz tiene prioridad sobre el `.env`.

> 💡 **Opcional — Google PageSpeed:** para incluir la nota oficial de rendimiento de Google en el diagnóstico en PDF, agregá una clave de [PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/get-started) en Configuración. Es gratis y funciona sin clave para uso liviano.

> 💡 **Recomendado — Tu perfil:** también en Configuración, completá "Tu perfil" (nombre y a qué te dedicás). Los mensajes generados por IA salen firmados y con tu voz, en vez de genéricos.

### 3. Bajá la dependencia externa del scraper

El `google-maps-scraper.exe` **no viene en el repositorio** (es un binario de terceros, ~60MB, de otro proyecto open source, así que no tiene sentido versionarlo dentro de un repo git). Paso a paso completo, sin saltear nada:

1. Entrá a **[la página de releases más reciente](https://github.com/gosom/google-maps-scraper/releases/latest)**.
2. Bajá hasta la sección **"Assets"** (está cerca del final de la página; a veces hay que hacer clic para expandirla).
3. Buscá el archivo para **Windows**. El nombre cambia en cada versión, pero sigue siempre el patrón `google_maps_scraper-<versión>-windows-amd64.exe`, por ejemplo: `google_maps_scraper-1.16.1-windows-amd64.exe`.

   > ⚠️ No bajes las versiones `linux` ni `darwin` (esas son para Linux/Mac). Necesitás específicamente la que tiene `windows` en el nombre.
4. Una vez bajado, **renombrá el archivo a exactamente `google-maps-scraper.exe`** (todo en minúscula, con guiones).
   - En Windows, si no ves la extensión `.exe` en el nombre del archivo, es normal (Windows oculta extensiones conocidas por defecto). No hace falta preocuparse, sólo renombrá la parte visible del nombre.
5. Movés ese archivo a la carpeta `backend/` de este proyecto, **al mismo nivel** que el archivo `app.py` (no dentro de ninguna subcarpeta).
6. Para verificar que salió bien, la carpeta `backend/` tiene que tener, uno al lado del otro: `app.py`, `processar.py` y `google-maps-scraper.exe`.

> ✅ **Cómo saber si funcionó:** al hacer clic en "Nueva búsqueda" en el canal Google Maps de ProspectOS, la búsqueda tiene que arrancar normalmente. Si aparece un error diciendo que no se encontró el programa, revisá el nombre del archivo (paso 4) y dónde está ubicado (paso 5). Son los dos errores más comunes.
>
> Sin este archivo, **sólo el canal Google Maps queda no disponible**. El canal Instagram funciona normalmente sin él.

> ⚠️ **¿Error de "Playwright/driver no disponible"?** En la primera búsqueda, el scraper baja un componente (driver de Playwright) de los servidores de Microsoft — en una versión fija, grabada dentro del `.exe`. Microsoft saca versiones viejas de ese componente de sus servidores, así que un `google-maps-scraper.exe` bajado hace tiempo puede buscar un driver que **ya no existe**. Solución: bajá de nuevo la [release más reciente](https://github.com/gosom/google-maps-scraper/releases/latest) y reemplazá el `.exe` — o, si preferís no depender del scraper, usá la **Google Places API oficial** en *Configuración → Fuente de datos*.

### 4. Iniciá sesión en Instagram (sólo si vas a usar ese canal)

El canal Instagram no usa la API oficial: automatiza tu **propia cuenta personal** (vía `instagrapi`) para leer comentarios y perfiles, igual que si estuvieras navegando manualmente. Por eso, antes de usar este canal por primera vez, hay que loguearse una vez desde la terminal:

```powershell
cd backend
py instagram\login.py TU_USUARIO
```

Qué pasa al correr esto:

1. La terminal pide tu **contraseña de Instagram** (la escritura queda invisible en pantalla, es normal, así funciona `getpass`).
2. Si tu cuenta tiene **verificación en dos pasos (2FA)** activada, la terminal se pausa y pide el código que llegue a tu celular o app autenticadora.
3. Si el login sale bien, aparece el mensaje `Login feito com sucesso` y se crea un archivo en `backend/instagram/sessao/session-TU_USUARIO.json`. Ese archivo guarda tu sesión logueada, así que **no hace falta repetir este paso cada vez**, sólo cuando la sesión expire.

> ⚠️ **Este es el paso de mayor riesgo del proyecto.** Como es tu cuenta personal haciendo esta automatización, Instagram puede detectar el comportamiento como sospechoso y aplicar un checkpoint de seguridad o baneo temporal/permanente. Recomendado: usá una **cuenta secundaria**, creada sólo para esto, nunca tu cuenta principal. Ver `backend/instagram/LEIA-ME.md` para más contexto.
>
> No hay forma de "probar" o simular este login sin una cuenta real de Instagram. No te saltees este paso si no pensás usar el canal Instagram — es totalmente independiente del canal Google Maps.

### 5. Configurá el frontend

```powershell
cd ../frontend
npm install
```

### 6. Corré todo

Usá el atajo que levanta backend + frontend juntos y abre el navegador automáticamente:

```powershell
cd ..
iniciar.bat
```

O manualmente, en dos terminales:

```powershell
# Terminal 1: backend
cd backend
py app.py

# Terminal 2: frontend
cd frontend
npm run dev
```

Entrá a **http://localhost:5173** 🎉

---

## 🛠️ Uso del día a día

**Canal Google Maps:**
```
Hacé clic en "Nueva búsqueda" y elegí el modo:
- Por texto: rubro + ciudad, uno por línea (ej: peluquería en Tandil)
- Por mapa: soltá pines, ajustá el radio de cada uno y elegí los rubros del catálogo
```
La herramienta analiza la web de cada negocio y mantiene en el CRM a quien **no tiene web o la tiene mala** (caída, insegura, lenta, no-mobile, constructor genérico...), descartando a quien ya tiene una web decente.

**Canal Instagram:**
```
Pegá el link de un post. La herramienta extrae los comentarios,
enriquece el perfil de cada autor y clasifica la prioridad con IA
```

**Prospección en ritmo:** abrí la **Sesión de prospección** — un lead por vez, del más caliente al más frío (seguimientos vencidos primero), con la estrategia y el mensaje listos y abordaje en un clic. O la pantalla **Tareas de hoy** para los seguimientos del día.

**En cada lead** tenés:
- La **estrategia de abordaje** (escenario, ángulo, ganchos y objeciones)
- La **radiografía de la web** (qué tiene y qué falta)
- El **mensaje por IA** con tu voz, y el **diagnóstico en PDF** para mandar por WhatsApp
- Embudo de estados (Kanban o lista), etiquetas, notas, seguimiento con fecha y exportación CSV

> 💡 Apretá **Ctrl+K** desde cualquier lado para buscar un lead por nombre o saltar a una pantalla.

**¿Querés usarlo sin interfaz visual?** El flujo viejo de línea de comandos sigue funcionando:
```powershell
cd backend
.\buscar.ps1
py processar.py
```

---

## 🧱 Stack

**Backend**
- Python 3.11+ · Flask 3.1 (blueprints) · SQLite
- [instagrapi](https://github.com/subzeroid/instagrapi) (Instagram) · [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper) (Maps, vía Playwright)
- Gemini / Groq / NVIDIA Build (generación de texto y clasificación por IA, con fallback automático)
- fpdf2 (diagnóstico en PDF) · keyring (cofre de credenciales) · PageSpeed Insights (opcional)

**Frontend**
- React 19 · TypeScript · Vite 8 · Tailwind CSS 4
- shadcn/ui (primitivas de Radix) · TanStack React Query · React Router 7
- Recharts (analytics) · Leaflet + OpenStreetMap (búsqueda por mapa) · Framer Motion (animaciones) · Sonner (toasts) · dnd-kit (Kanban)

---

## 📁 Estructura del proyecto

```
ProspectOS/
├── iniciar.bat              # levanta backend + frontend juntos
├── backend/
│   ├── app.py                # arma Flask y registra los blueprints
│   ├── rotas_*.py             # rutas por dominio (leads, instagram, analytics, config)
│   ├── ia.py                  # proveedores de IA, prompts y fallback
│   ├── jobs.py                # jobs de background (scraper y análisis de Instagram)
│   ├── processar.py           # análisis de web + filtro/dedupe + schema de la base
│   ├── diagnostico.py         # generación del diagnóstico en PDF
│   ├── db.py                  # conexión, cofre de credenciales y backup
│   ├── instagram/             # login, scraping y enriquecimiento de perfiles
│   └── tests/                 # suite de tests (pytest, 375 tests)
└── frontend/
    ├── src/
    │   ├── pages/             # pantallas (dashboard, leads, sesión, tareas, analytics...)
    │   ├── components/        # UI por dominio (leads/, instagram/, dashboard/, search-modal/...)
    │   ├── hooks/              # data-fetching y mutations (React Query)
    │   ├── services/           # llamadas HTTP a la API del backend
    │   ├── lib/                # estrategia, catálogo de rubros, utilidades
    │   └── types/               # tipos TypeScript espejo del schema del backend
    └── public/
```

---

## 💭 Filosofía del proyecto

- **Dos canales, una sola experiencia.** Google Maps e Instagram tienen flujos de datos bien distintos, pero el producto final (embudo, etiquetas, seguimiento, IA) es un espejo en los dos. Lo que funciona en un canal debería funcionar igual en el otro.
- **IA con fallback, nunca bloqueante.** Toda generación de texto por IA prueba varios proveedores gratuitos en secuencia antes de rendirse, porque depender de una sola API gratis es asumir que en algún momento va a fallar (cuota, inestabilidad).
- **Honestidad sobre los riesgos.** El scraping y la automatización de cuentas personales tienen riesgo real de baneo/bloqueo. El proyecto no lo esconde en letra chica: los avisos están arriba de todo en el README, no al pie.
- **Simple de correr localmente.** Sin Docker, sin infraestructura compleja, sólo Python, Node y SQLite. La barrera de entrada para probar el proyecto tiene que ser la mínima posible.

---

## ❓ Preguntas frecuentes

**Quiero borrar todo y arrancar de cero.**
Cerrá el backend, borrá `backend/leads.db` y corré de nuevo (recrea la base vacía). Hay backup automático en `backend/backups/`.

**Quiero correr los tests automatizados.**
```powershell
cd backend
py -m pytest
```

**¿El canal Instagram depende del `google-maps-scraper.exe`?**
No. Los dos canales son independientes. La falta de uno no traba al otro.

**Me bloquearon la cuenta de Instagram, ¿y ahora?**
Corré `py instagram\login.py TU_USUARIO` de nuevo. Ver `backend/instagram/LEIA-ME.md` para más contexto sobre ese riesgo.

---

## 🔀 Este fork vs. el original

Este repositorio es un fork traducido de [nando0x/ProspectOS](https://github.com/nando0x/ProspectOS) con estos cambios:

- **Interfaz completa en español rioplatense** (con voseo): todas las páginas, componentes, mensajes de error y de progreso del panel y del backend. Queda en portugués sólo la sección de ayuda dentro de la app (Documentación) y algún mensaje de error puntual del canal Instagram que menciona comandos de terminal.
- **Prompts de IA y estrategia de venta re-orientados**: de "vendo la creación de un sitio web" a "automatizo la atención por WhatsApp" (PresencIA). El detector de sitio sin web/con web mala se mantiene igual — sólo cambió a qué se lo lleva la conversación de venta.
- **Catálogo de rubros en español rioplatense** (`frontend/src/lib/nichos.ts`): términos de búsqueda como se usan en Argentina, en vez de portugués de Brasil.
- **Scraper e idioma de búsqueda en español/Argentina** (`-lang es`, `languageCode: es-419`, `regionCode: AR`) en vez de portugués/Brasil, para que Google Maps devuelva rubros y descripciones en español.

Si el proyecto original recibe actualizaciones, este fork las tiene disponibles con `git remote add upstream https://github.com/nando0x/ProspectOS.git` y `git fetch upstream`, pero un merge directo probablemente choque con casi todo lo traducido — conviene revisarlo a mano, cambio por cambio.

---

## 📄 Licencia

[MIT](LICENSE). Usalo, modificalo y redistribuilo libremente, pero por tu cuenta y riesgo (ver los avisos arriba de todo en este README).

---

## 🙏 Agradecimientos

- [nando0x/ProspectOS](https://github.com/nando0x/ProspectOS): proyecto original del que sale este fork
- [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper): scraper de Google Maps usado como dependencia externa
- [subzeroid/instagrapi](https://github.com/subzeroid/instagrapi): librería usada para el canal Instagram
- [shadcn/ui](https://ui.shadcn.com/): componentes base del frontend
- Google Gemini, Groq y NVIDIA Build: proveedores de IA gratuitos usados en la generación de texto

<div align="center">

Hecho con foco en resolver un problema real de prospección para PresencIA.

</div>
