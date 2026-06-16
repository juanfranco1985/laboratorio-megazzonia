const STATUS_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "diseno", label: "En diseno" },
  { value: "desarrollo", label: "En desarrollo" },
  { value: "validado", label: "Validado" }
];

const DEFAULT_ACCENTS = ["#0f766e", "#2563eb", "#7c3aed", "#b45309", "#be123c", "#0891b2", "#4d7c0f", "#db2777"];

const state = {
  activeId: null,
  tab: "home",
  query: "",
  domain: "all",
  status: "all",
  favoritesOnly: false,
  favorites: new Set(),
  compareIds: new Set(),
  theme: "light",
  customProjects: [],
  checklist: {},
  plan: {}
};

const STORAGE_KEYS = {
  activeProject: "activeProjectId",
  favorites: "favoriteProjectIds",
  compare: "compareProjectIds",
  theme: "themePreference",
  customProjects: "customProjects",
  checklist: "projectChecklist",
  plan: "projectPlan"
};

const baseProjects = (window.DATA_PROJECTS || []).map((project) => normalizeProject(project, "base"));
let projects = [...baseProjects];
const projectList = document.querySelector("#projectList");
const projectDetail = document.querySelector("#projectDetail");
const searchInput = document.querySelector("#searchInput");
const domainFilter = document.querySelector("#domainFilter");
const statusFilter = document.querySelector("#statusFilter");
const favoritesOnly = document.querySelector("#favoritesOnly");
const copyPromptButton = document.querySelector("#copyPrompt");
const exportButton = document.querySelector("#exportCurrent");
const exportAllButton = document.querySelector("#exportAll");
const themeToggleButton = document.querySelector("#themeToggle");
const printButton = document.querySelector("#printView");
const copyLinkButton = document.querySelector("#copyLink");
const newProjectButton = document.querySelector("#newProject");
const duplicateProjectButton = document.querySelector("#duplicateProject");
const exportJsonButton = document.querySelector("#exportJson");
const importJsonButton = document.querySelector("#importJson");
const importJsonInput = document.querySelector("#importJsonInput");
const toast = document.querySelector("#toast");

const PROJECT_PROFILES = {
  "fraude-rnn": {
    useCase: "Banco digital que necesita priorizar alertas de fraude en tarjetas y transferencias sin bloquear operaciones legitimas de clientes frecuentes.",
    datasets: ["IEEE-CIS Fraud Detection", "Credit Card Fraud Detection", "simulador propio de stream transaccional"],
    team: "Data scientist senior, data engineer, backend engineer y analista antifraude.",
    architecture: "Stream de eventos, feature store temporal, servicio de scoring, cola de alertas y dashboard de supervision.",
    risks: ["Fuga temporal en features agregadas", "umbral demasiado agresivo", "drift por nuevas tacticas de fraude"]
  },
  "energia-jerarquica": {
    useCase: "Empresa de energia que planifica demanda por barrio y ciudad para comprar energia, detectar picos y anticipar capacidad operativa.",
    datasets: ["UCI Individual Household Electric Power", "Open-Meteo historico", "calendario de feriados local"],
    team: "Especialista en series temporales, data engineer y analista de operaciones energeticas.",
    architecture: "Ingesta por fuentes, panel horario, entrenamiento por nivel jerarquico, reconciliacion y API de forecast.",
    risks: ["Estacionalidad mal capturada", "exogenas incompletas", "predicciones inconsistentes entre niveles"]
  },
  "legal-nlp": {
    useCase: "Legaltech que analiza terminos y condiciones para clasificar clausulas de riesgo y generar resumenes ejecutivos revisables.",
    datasets: ["LEDGAR", "CUAD", "corpus propio de terminos y condiciones"],
    team: "NLP engineer, abogado revisor, data annotator y backend engineer.",
    architecture: "Pipeline de documentos, segmentador de clausulas, clasificador, resumidor y visor con referencias al texto fuente.",
    risks: ["Alucinaciones en resumen", "clases ambiguas", "uso indebido como asesoramiento legal definitivo"]
  },
  "cartera-montecarlo": {
    useCase: "Mesa de inversion que busca comparar carteras bajo escenarios de volatilidad, restricciones de riesgo y stress testing.",
    datasets: ["Yahoo Finance", "Stooq", "series internas de precios y benchmarks"],
    team: "Quant analyst, data scientist financiero y responsable de riesgos.",
    architecture: "Loader de mercado, motor de riesgo, optimizador, simulador Montecarlo y reporte ejecutivo.",
    risks: ["Supuestos de retorno inestables", "correlaciones no estacionarias", "sobreajuste a periodos historicos"]
  },
  "mri-unet": {
    useCase: "Equipo de investigacion medica que necesita segmentar tumores en MRI para acelerar revision visual y medicion reproducible.",
    datasets: ["BraTS", "TCIA", "dataset interno anonimizado con mascaras expertas"],
    team: "Computer vision engineer, especialista medico, MLOps engineer y responsable de datos clinicos.",
    architecture: "Preprocesamiento DICOM, entrenamiento U-Net, inferencia por estudio y visor de overlays para revision.",
    risks: ["Split por imagen en lugar de paciente", "variabilidad de escaner", "uso clinico sin validacion regulatoria"]
  },
  "recomendador-xai": {
    useCase: "Marketplace o ecommerce que necesita recomendaciones personalizadas con razones claras para aumentar confianza y conversion.",
    datasets: ["MovieLens", "Amazon Reviews", "catalogo propio con interacciones anonimizadas"],
    team: "Data scientist de recomendadores, data engineer, product analyst y backend engineer.",
    architecture: "Generador de candidatos, ranker hibrido, servicio top-k, motor de explicaciones y monitoreo de cobertura.",
    risks: ["Sesgo hacia popularidad", "explicaciones superficiales", "baja cobertura en usuarios o items nuevos"]
  },
  "rul-industrial": {
    useCase: "Planta industrial que prioriza mantenimiento de activos criticos antes de fallas, reduciendo paradas no planificadas.",
    datasets: ["NASA CMAPSS", "PHM datasets", "telemetria interna de sensores"],
    team: "Data scientist industrial, reliability engineer, data engineer y responsable de mantenimiento.",
    architecture: "Ingesta de sensores, calidad de datos, ventanas RUL, modelo de riesgo y tablero de priorizacion.",
    risks: ["Etiquetas de falla incompletas", "drift por mantenimiento", "predicciones sin umbral operativo claro"]
  },
  "absa-productos": {
    useCase: "Equipo de producto que quiere entender que atributos generan satisfaccion o reclamos dentro de resenas extensas.",
    datasets: ["SemEval ABSA", "Amazon Reviews", "resenas internas etiquetadas"],
    team: "NLP engineer, data annotator, product analyst y frontend engineer.",
    architecture: "Normalizacion, extraccion de aspectos, clasificador de sentimiento, agregador por atributo y tablero de insights.",
    risks: ["Spans mal etiquetados", "sarcasmo o negaciones", "polaridad global confundida con polaridad por aspecto"]
  },
  "genomica-clustering": {
    useCase: "Laboratorio bioinformatico que explora subtipos potenciales de enfermedad a partir de expresion genetica de alta dimension.",
    datasets: ["TCGA", "GEO expression datasets", "matrices internas anonimizadas"],
    team: "Bioinformatico, data scientist, investigador de dominio y especialista en visualizacion.",
    architecture: "QC genomico, normalizacion, reduccion de dimensionalidad, clustering, validacion y visualizacion interactiva.",
    risks: ["Batch effects", "clusters poco estables", "interpretacion biologica prematura"]
  },
  "kaggle-feature-engineering": {
    useCase: "Equipo competitivo que necesita acelerar prototipos tabulares reutilizables para Kaggle, benchmarks internos o pruebas de concepto.",
    datasets: ["Titanic", "House Prices", "competencias tabulares activas de Kaggle"],
    team: "ML engineer, data scientist competitivo y reviewer de validacion.",
    architecture: "Config de competencia, generador de features, validacion, tuning Optuna y generador de submission.",
    risks: ["Data leakage", "CV no representativo", "features costosas sin ganancia real"]
  }
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 58) || "proyecto";
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeProject(project = {}, source = "custom", index = 0) {
  const title = String(project.title || "Nuevo proyecto analitico").trim();
  const id = String(project.id || `${source}-${slugify(title)}-${Date.now()}`).trim();
  const number = Number.isFinite(Number(project.number)) ? Number(project.number) : index + 1;

  const status = String(project.status || "idea");

  return {
    id,
    number,
    title,
    shortTitle: String(project.shortTitle || title).trim().slice(0, 42),
    domain: String(project.domain || "Personalizado").trim(),
    level: String(project.level || "Alta complejidad").trim(),
    horizon: String(project.horizon || "6 a 8 semanas").trim(),
    accent: String(project.accent || DEFAULT_ACCENTS[index % DEFAULT_ACCENTS.length]).trim(),
    objective: String(project.objective || "Definir un objetivo profesional, medible y orientado a producto.").trim(),
    summary: String(project.summary || "Proyecto personalizado creado desde el editor local.").trim(),
    challenge: normalizeList(project.challenge),
    folderTree: normalizeList(project.folderTree),
    methodology: normalizeList(project.methodology),
    deliverables: normalizeList(project.deliverables),
    metrics: normalizeList(project.metrics),
    stack: normalizeList(project.stack),
    acceptance: normalizeList(project.acceptance),
    starterCode: normalizeList(project.starterCode),
    exampleOutput: project.exampleOutput && typeof project.exampleOutput === "object" ? project.exampleOutput : null,
    status: STATUS_OPTIONS.some((option) => option.value === status) ? status : "idea",
    source
  };
}

function refreshProjects() {
  projects = [...baseProjects, ...state.customProjects.map((project, index) => normalizeProject(project, "custom", baseProjects.length + index))];
}

function saveCustomProjects() {
  localStorage.setItem(STORAGE_KEYS.customProjects, JSON.stringify(state.customProjects));
}

function saveChecklist() {
  localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(state.checklist));
}

function savePlan() {
  localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(state.plan));
}

function nextProjectNumber() {
  return Math.max(0, ...projects.map((project) => Number(project.number) || 0)) + 1;
}

function statusLabel(status) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label || "Idea";
}

function isValidTab(tab) {
  return ["home", "blueprint", "roadmap", "editor", "compare", "prompt", "mobile"].includes(tab);
}

function cloneProjectForCustom(project, suffix = "copia") {
  const copy = JSON.parse(JSON.stringify(project));
  const number = nextProjectNumber();
  copy.id = `custom-${slugify(project.shortTitle || project.title)}-${Date.now()}`;
  copy.number = number;
  copy.title = `${project.title} (${suffix})`;
  copy.shortTitle = `${project.shortTitle || "Proyecto"} ${number}`.slice(0, 42);
  copy.source = "custom";
  copy.status = copy.status || "idea";
  return normalizeProject(copy, "custom", number - 1);
}

function blankProject() {
  const number = nextProjectNumber();
  return normalizeProject(
    {
      id: `custom-nuevo-proyecto-${Date.now()}`,
      number,
      title: "Nuevo proyecto analitico profesional",
      shortTitle: `Proyecto ${number}`,
      domain: "Personalizado",
      accent: DEFAULT_ACCENTS[number % DEFAULT_ACCENTS.length],
      objective: "Describir el objetivo medible del proyecto y el usuario que se beneficia.",
      summary: "Resumen ejecutivo del proyecto, alcance funcional y valor esperado.",
      challenge: ["Definir la calidad de datos requerida", "Evitar fuga de informacion", "Preparar una entrega reproducible"],
      folderTree: ["data/raw/", "data/processed/", "src/models/", "src/evaluation/", "reports/"],
      methodology: ["Construir baseline", "Entrenar modelo avanzado", "Evaluar contra metricas de negocio", "Documentar limitaciones"],
      deliverables: ["Dataset simulado", "Modelo entrenado", "Dashboard ejecutivo", "README tecnico"],
      metrics: ["F1", "RMSE", "Tiempo de inferencia"],
      stack: ["Python", "Pandas", "scikit-learn", "Plotly"],
      acceptance: ["Pipeline reproducible", "Metricas reportadas", "Documentacion lista para presentacion"],
      status: "idea"
    },
    "custom",
    number - 1
  );
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));
}

function isFavorite(id) {
  return state.favorites.has(id);
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...state.favorites]));
}

function saveCompareIds() {
  localStorage.setItem(STORAGE_KEYS.compare, JSON.stringify([...state.compareIds]));
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }

  saveFavorites();
  render();
}

function toggleCompare(id) {
  if (state.compareIds.has(id)) {
    state.compareIds.delete(id);
  } else {
    if (state.compareIds.size >= 4) {
      showToast("El comparador admite hasta cuatro proyectos.");
      return;
    }
    state.compareIds.add(id);
  }

  saveCompareIds();
  render();
}

function setTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = state.theme;
  themeToggleButton.textContent = state.theme === "dark" ? "Modo claro" : "Modo oscuro";
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
}

function activeProject() {
  return projects.find((project) => project.id === state.activeId) || projects[0];
}

function filteredProjects() {
  const query = state.query.trim().toLowerCase();
  return projects.filter((project) => {
    const matchesDomain = state.domain === "all" || project.domain === state.domain;
    if (!matchesDomain) return false;
    const matchesStatus = state.status === "all" || project.status === state.status;
    if (!matchesStatus) return false;
    if (state.favoritesOnly && !state.favorites.has(project.id)) return false;
    if (!query) return true;

    const haystack = [
      project.title,
      project.domain,
      project.level,
      project.summary,
      project.objective,
      ...project.challenge,
      ...project.methodology,
      ...project.deliverables,
      ...project.metrics,
      ...project.stack
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

function buildFolderTree(project) {
  return project.folderTree.map((path) => `project/${path}`).join("\n");
}

function currentUrl() {
  const url = new URL(window.location.href);
  url.search = "";

  if (state.tab !== "home" && activeProject()) {
    url.searchParams.set("project", activeProject().id);
  }

  if (state.tab !== "home") {
    url.searchParams.set("tab", state.tab);
  }

  if (state.query.trim()) {
    url.searchParams.set("q", state.query.trim());
  }

  if (state.domain !== "all") {
    url.searchParams.set("domain", state.domain);
  }

  if (state.status !== "all") {
    url.searchParams.set("status", state.status);
  }

  if (state.favoritesOnly) {
    url.searchParams.set("favorites", "1");
  }

  return url.toString();
}

function syncUrl() {
  if (!window.history || location.protocol === "file:") return;
  window.history.replaceState(null, "", currentUrl());
}

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("project");
  const tab = params.get("tab");
  const query = params.get("q");
  const domain = params.get("domain");
  const status = params.get("status");

  if (query) {
    state.query = query;
    searchInput.value = query;
  }

  if (domain && unique(projects.map((project) => project.domain)).includes(domain)) {
    state.domain = domain;
  }

  if (status && STATUS_OPTIONS.some((option) => option.value === status)) {
    state.status = status;
  }

  if (params.get("favorites") === "1") {
    state.favoritesOnly = true;
    favoritesOnly.checked = true;
  }

  if (projectId && projects.some((project) => project.id === projectId)) {
    state.activeId = projectId;
  }

  if (tab && isValidTab(tab)) {
    state.tab = tab;
  }
}

function profileFor(project) {
  return PROJECT_PROFILES[project.id] || {
    useCase: project.objective,
    datasets: ["dataset simulado", "dataset publico equivalente", "fuente interna anonimizada"],
    team: "Data scientist, data engineer y responsable de producto.",
    architecture: "Ingesta, procesamiento, modelo, evaluacion y dashboard operativo.",
    risks: ["calidad de datos", "drift", "validacion insuficiente"]
  };
}

function buildPrompt(project) {
  const sections = [
    "Actua como lider tecnico de ciencia de datos y arquitecto de producto. Desarrolla un proyecto profesional, reproducible y listo para integrarse en una aplicacion web y una version Android.",
    `Titulo del proyecto: ${project.title}`,
    `Dominio: ${project.domain}`,
    `Nivel: ${project.level}`,
    `Horizonte recomendado: ${project.horizon}`,
    `Objetivo: ${project.objective}`,
    `Resumen ejecutivo: ${project.summary}`,
    "Problema y desafios:\n" + project.challenge.map((item) => `- ${item}`).join("\n"),
    "Estructura de carpetas requerida:\n" + project.folderTree.map((item) => `- ${item}`).join("\n"),
    "Metodologia tecnica:\n" + project.methodology.map((item) => `- ${item}`).join("\n"),
    "Entregables esperados:\n" + project.deliverables.map((item) => `- ${item}`).join("\n"),
    "Metricas de evaluacion:\n" + project.metrics.map((item) => `- ${item}`).join("\n"),
    "Stack sugerido:\n" + project.stack.map((item) => `- ${item}`).join("\n"),
    "Criterios de aceptacion:\n" + project.acceptance.map((item) => `- ${item}`).join("\n"),
    "Incluye instrucciones de instalacion, supuestos, riesgos, pruebas minimas, ejemplo de datos simulados y una guia para mostrar resultados en dashboard web y pantalla movil."
  ];

  if (project.starterCode.length) {
    sections.push("Codigo base inicial:\n" + project.starterCode.join("\n"));
  }

  if (project.exampleOutput) {
    sections.push(
      "Ejemplo de salida requerida:\n" +
        JSON.stringify(project.exampleOutput, null, 2)
    );
  }

  return sections.join("\n\n");
}

function markdownFor(project) {
  const profile = profileFor(project);
  const output = [
    `# ${project.title}`,
    "",
    `**Dominio:** ${project.domain}`,
    `**Nivel:** ${project.level}`,
    `**Horizonte:** ${project.horizon}`,
    "",
    "## Objetivo",
    project.objective,
    "",
    "## Caso de uso real",
    profile.useCase,
    "",
    "## Datasets sugeridos",
    profile.datasets.map((item) => `- ${item}`).join("\n"),
    "",
    "## Desafios",
    project.challenge.map((item) => `- ${item}`).join("\n"),
    "",
    "## Estructura",
    "```text",
    buildFolderTree(project),
    "```",
    "",
    "## Metodologia",
    project.methodology.map((item) => `- ${item}`).join("\n"),
    "",
    "## Entregables",
    project.deliverables.map((item) => `- ${item}`).join("\n"),
    "",
    "## Metricas",
    project.metrics.map((item) => `- ${item}`).join("\n"),
    "",
    "## Stack sugerido",
    project.stack.map((item) => `- ${item}`).join("\n"),
    "",
    "## Criterios de aceptacion",
    project.acceptance.map((item) => `- ${item}`).join("\n"),
    "",
    "## Arquitectura de referencia",
    profile.architecture,
    "",
    "## Equipo minimo",
    profile.team,
    "",
    "## Riesgos principales",
    profile.risks.map((item) => `- ${item}`).join("\n"),
    "",
    "## Roadmap",
    roadmapFor(project).map((phase) => `- **${phase.title} (${phase.duration})**: ${phase.outcome}`).join("\n"),
    "",
    "## Prompt profesional",
    "```text",
    buildPrompt(project),
    "```"
  ];

  if (project.starterCode.length) {
    output.push("", "## Codigo base", "```python", project.starterCode.join("\n"), "```");
  }

  if (project.exampleOutput) {
    output.push("", "## Ejemplo de salida", "```json", JSON.stringify(project.exampleOutput, null, 2), "```");
  }

  return output.join("\n");
}

function markdownForPortfolio() {
  return [
    "# Portfolio de Proyectos Analiticos",
    "",
    `Coleccion profesional de ${projects.length} proyectos avanzados de ciencia de datos, prompts maestros y criterios de implementacion para web y Android.`,
    "",
    "## Indice ejecutivo",
    "",
    "| # | Proyecto | Dominio | Horizonte |",
    "|---|---|---|---|",
    ...projects.map((project) => `| ${project.number} | ${project.title} | ${project.domain} | ${project.horizon} |`),
    "",
    ...projects.map(markdownFor)
  ].join("\n");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function renderDomainFilter() {
  const domains = unique(projects.map((project) => project.domain));
  const current = state.domain;
  domainFilter.innerHTML =
    '<option value="all">Todos</option>' +
    domains.map((domain) => `<option value="${escapeHtml(domain)}">${escapeHtml(domain)}</option>`).join("");
  domainFilter.value = domains.includes(current) ? current : "all";
  state.domain = domainFilter.value;
}

function renderStatusFilter() {
  const current = state.status;
  statusFilter.innerHTML =
    '<option value="all">Todos</option>' +
    STATUS_OPTIONS.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("");
  statusFilter.value = STATUS_OPTIONS.some((option) => option.value === current) ? current : "all";
  state.status = statusFilter.value;
}

function renderStats() {
  const domains = unique(projects.map((project) => project.domain));
  const metrics = unique(projects.flatMap((project) => project.metrics));
  document.querySelector("#totalProjects").textContent = String(projects.length);
  document.querySelector("#domainCount").textContent = String(domains.length);
  document.querySelector("#metricCount").textContent = String(metrics.length);
  document.querySelector("#favoriteCount").textContent = String(state.favorites.size);
}

function renderCards() {
  const visibleProjects = filteredProjects();

  if (!visibleProjects.length) {
    projectList.innerHTML = '<p class="empty-state">No hay proyectos para ese filtro.</p>';
    return;
  }

  projectList.innerHTML = visibleProjects
    .map((project) => {
      const favorite = isFavorite(project.id);
      return `
        <article class="project-card ${project.id === state.activeId ? "is-active" : ""}"
          style="--accent: ${escapeHtml(project.accent)}">
          <button class="project-card-main"
            type="button"
            data-project-id="${escapeHtml(project.id)}">
            <span class="project-number">${project.number}</span>
            <span>
              <h2>${escapeHtml(project.shortTitle)}</h2>
              <p>${escapeHtml(project.summary)}</p>
              <span class="tag-row">
                <span class="pill">${escapeHtml(project.domain)}</span>
                <span class="pill">${escapeHtml(project.horizon)}</span>
                <span class="pill">${escapeHtml(statusLabel(project.status))}</span>
                ${project.source === "custom" ? '<span class="pill">Editable</span>' : ""}
              </span>
            </span>
          </button>
          <button class="favorite-button ${favorite ? "is-active" : ""}"
            type="button"
            data-favorite-id="${escapeHtml(project.id)}"
            aria-label="${favorite ? "Quitar favorito" : "Guardar favorito"}">
            ${favorite ? "Fav" : "Marcar"}
          </button>
        </article>
      `;
    })
    .join("");
}

function listMarkup(items) {
  return `<ul class="content-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function pillMarkup(items) {
  return `<div class="metric-row">${items.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreFor(project) {
  const completenessFields = [
    project.title,
    project.objective,
    project.summary,
    project.horizon,
    project.challenge.length,
    project.methodology.length,
    project.deliverables.length,
    project.metrics.length,
    project.stack.length,
    project.acceptance.length
  ];
  const completeness = clampScore((completenessFields.filter(Boolean).length / completenessFields.length) * 100);
  const clarity = clampScore(((project.objective.length > 90 ? 35 : 20) + (project.summary.length > 120 ? 35 : 20) + (project.challenge.length >= 3 ? 30 : project.challenge.length * 10)));
  const feasibility = clampScore((project.horizon ? 25 : 0) + Math.min(project.stack.length, 4) * 10 + Math.min(project.metrics.length, 4) * 10 + Math.min(project.acceptance.length, 3) * 15);
  const value = clampScore(Math.min(project.deliverables.length, 4) * 15 + Math.min(project.methodology.length, 5) * 8 + (profileFor(project).useCase.length > 80 ? 20 : 10));
  const total = clampScore((completeness + clarity + feasibility + value) / 4);
  return { total, completeness, clarity, feasibility, value };
}

function checklistItems(project) {
  return [
    ...project.deliverables.map((item) => `Entregable: ${item}`),
    ...project.acceptance.slice(0, 4).map((item) => `Aceptacion: ${item}`)
  ].slice(0, 10);
}

function isChecklistDone(projectId, item) {
  return Boolean(state.checklist[projectId]?.[item]);
}

function toggleChecklist(projectId, item, checked) {
  state.checklist[projectId] = state.checklist[projectId] || {};
  state.checklist[projectId][item] = checked;
  saveChecklist();
  render();
}

function isPlanDone(projectId, item) {
  return Boolean(state.plan[projectId]?.[item]);
}

function togglePlan(projectId, item, checked) {
  state.plan[projectId] = state.plan[projectId] || {};
  state.plan[projectId][item] = checked;
  savePlan();
  render();
}

function renderScore(project) {
  const score = scoreFor(project);
  const rows = [
    ["Completitud", score.completeness],
    ["Claridad", score.clarity],
    ["Viabilidad", score.feasibility],
    ["Valor", score.value]
  ];

  return `
    <section class="score-panel">
      <div class="score-total">
        <span>Score profesional</span>
        <strong>${score.total}</strong>
      </div>
      <div class="score-bars">
        ${rows
          .map(
            ([label, value]) => `
              <div class="score-row" style="--score-width: ${value}%">
                <span>${escapeHtml(label)}</span>
                <div><i></i></div>
                <strong>${value}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderChecklist(project) {
  const items = checklistItems(project);
  const done = items.filter((item) => isChecklistDone(project.id, item)).length;
  return `
    <section class="content-block checklist-panel">
      <h3>Checklist interactivo de entregables</h3>
      <p>${done} de ${items.length} items completados.</p>
      <div class="checklist-grid">
        ${items
          .map(
            (item) => `
              <label>
                <input type="checkbox"
                  data-checklist-project="${escapeHtml(project.id)}"
                  data-checklist-item="${escapeHtml(item)}"
                  ${isChecklistDone(project.id, item) ? "checked" : ""}>
                <span>${escapeHtml(item)}</span>
              </label>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function domainStats() {
  return unique(projects.map((project) => project.domain)).map((domain) => {
    const domainProjects = projects.filter((project) => project.domain === domain);
    return {
      domain,
      count: domainProjects.length,
      accent: domainProjects[0]?.accent || "#2563eb"
    };
  });
}

function stackStats() {
  const counts = new Map();
  projects.flatMap((project) => project.stack).forEach((stack) => {
    counts.set(stack, (counts.get(stack) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"))
    .slice(0, 8);
}

function averageHorizon() {
  const averages = projects.map((project) => {
    const values = project.horizon.match(/\d+/g)?.map(Number) || [];
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  });

  const total = averages.reduce((sum, value) => sum + value, 0);
  return Math.round(total / averages.length);
}

function barRows(items, maxValue, labelKey = "label") {
  return items
    .map((item) => {
      const label = item[labelKey];
      const width = Math.max(8, Math.round((item.count / maxValue) * 100));
      const accent = item.accent || "#2563eb";
      return `
        <div class="bar-row" style="--bar-width: ${width}%; --accent: ${escapeHtml(accent)}">
          <span>${escapeHtml(label)}</span>
          <div><i></i></div>
          <strong>${item.count}</strong>
        </div>
      `;
    })
    .join("");
}

function roadmapFor(project) {
  const profile = profileFor(project);
  return [
    {
      title: "Descubrimiento y alcance",
      duration: "Semana 1",
      outcome: "problema, usuarios, metricas, supuestos y criterios de aceptacion alineados.",
      tasks: [
        `Validar caso de uso: ${profile.useCase}`,
        `Definir metricas principales: ${project.metrics.slice(0, 3).join(", ")}.`,
        "Cerrar restricciones de negocio, privacidad y despliegue."
      ]
    },
    {
      title: "Datos y arquitectura",
      duration: "Semanas 2 a 3",
      outcome: "datasets, estructura de carpetas y pipeline de ingesta listos para experimentacion.",
      tasks: [
        `Evaluar fuentes: ${profile.datasets.join(", ")}.`,
        `Preparar arquitectura: ${profile.architecture}`,
        "Crear validaciones de calidad, versionado y separacion train/test."
      ]
    },
    {
      title: "Modelado y validacion",
      duration: "Semanas 4 a 6",
      outcome: "baseline, modelo avanzado y evaluacion reproducible contra metricas clave.",
      tasks: [
        project.methodology[1],
        project.methodology[2],
        `Medir desempeno con ${project.metrics.join(", ")}.`
      ]
    },
    {
      title: "Producto y experiencia",
      duration: "Semanas 7 a 8",
      outcome: "dashboard, ficha tecnica, prompt maestro y flujo usable para web y Android.",
      tasks: [
        project.deliverables[1] || project.deliverables[0],
        "Preparar vistas ejecutivas, exportacion y explicaciones para usuarios no tecnicos.",
        "Documentar instalacion, ejecucion, limites y decisiones de diseno."
      ]
    },
    {
      title: "Gobierno y entrega",
      duration: "Cierre",
      outcome: "entrega auditable con riesgos, checklist operativo y plan de mejora continua.",
      tasks: [
        `Controlar riesgos: ${profile.risks.join(", ")}.`,
        "Revisar criterios de aceptacion antes de empaquetar.",
        "Definir monitoreo, retraining y responsables."
      ]
    }
  ];
}

function renderRoadmap(project) {
  const profile = profileFor(project);
  const phases = roadmapFor(project);

  return `
    ${renderHeader(project)}
    <div class="detail-body" style="--accent: ${escapeHtml(project.accent)}">
      <section class="section-grid">
        <div class="content-block">
          <h3>Caso de uso real</h3>
          <p>${escapeHtml(profile.useCase)}</p>
        </div>
        <div class="content-block">
          <h3>Equipo minimo</h3>
          <p>${escapeHtml(profile.team)}</p>
        </div>
      </section>
      <section class="section-grid">
        <div class="content-block">
          <h3>Datasets sugeridos</h3>
          ${listMarkup(profile.datasets)}
        </div>
        <div class="content-block">
          <h3>Arquitectura de referencia</h3>
          <p>${escapeHtml(profile.architecture)}</p>
        </div>
      </section>
      <section class="timeline">
        ${phases
          .map(
            (phase, index) => `
              <article>
                <span>${index + 1}</span>
                <div>
                  <small>${escapeHtml(phase.duration)}</small>
                  <h3>${escapeHtml(phase.title)}</h3>
                  <p>${escapeHtml(phase.outcome)}</p>
                  ${listMarkup(phase.tasks)}
                </div>
              </article>
            `
          )
          .join("")}
      </section>
      ${renderDeliveryPlan(project, phases)}
      <section class="section-grid">
        <div class="content-block">
          <h3>Riesgos a controlar</h3>
          ${listMarkup(profile.risks)}
        </div>
        <div class="content-block">
          <h3>Checklist de entrega</h3>
          ${listMarkup([
            "Repositorio con estructura y scripts documentados.",
            "Notebook o reporte con analisis de errores.",
            "Dashboard o vista ejecutiva con metricas principales.",
            "Modelo, datos simulados y criterios de aceptacion reproducibles.",
            "Ficha exportable en Markdown o impresion lista para presentar."
          ])}
        </div>
      </section>
    </div>
  `;
}

function renderDeliveryPlan(project, phases = roadmapFor(project)) {
  const tasks = phases.flatMap((phase) => phase.tasks.map((task) => `${phase.title}: ${task}`));
  const done = tasks.filter((task) => isPlanDone(project.id, task)).length;

  return `
    <section class="content-block plan-panel">
      <h3>Plan de entrega marcable</h3>
      <p>${done} de ${tasks.length} tareas completadas.</p>
      <div class="checklist-grid">
        ${tasks
          .map(
            (task) => `
              <label>
                <input type="checkbox"
                  data-plan-project="${escapeHtml(project.id)}"
                  data-plan-item="${escapeHtml(task)}"
                  ${isPlanDone(project.id, task) ? "checked" : ""}>
                <span>${escapeHtml(task)}</span>
              </label>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function selectedCompareProjects() {
  const selected = [...state.compareIds]
    .map((id) => projects.find((project) => project.id === id))
    .filter(Boolean);
  return selected.length ? selected : projects.slice(0, 3);
}

function compareCell(project, row) {
  const profile = profileFor(project);
  const values = {
    dominio: project.domain,
    horizonte: project.horizon,
    objetivo: project.objective,
    metricas: project.metrics.join(", "),
    stack: project.stack.join(", "),
    entregables: project.deliverables.slice(0, 3).join(" | "),
    equipo: profile.team,
    datasets: profile.datasets.join(", "),
    riesgos: profile.risks.join(", ")
  };
  return values[row] || "";
}

function renderCompare() {
  const selected = selectedCompareProjects();
  const rows = [
    ["dominio", "Dominio"],
    ["horizonte", "Horizonte"],
    ["objetivo", "Objetivo"],
    ["metricas", "Metricas"],
    ["stack", "Stack"],
    ["entregables", "Entregables clave"],
    ["equipo", "Equipo minimo"],
    ["datasets", "Datasets sugeridos"],
    ["riesgos", "Riesgos"]
  ];

  return `
    <header class="home-hero compact-hero">
      <div>
        <p class="eyebrow">Comparador</p>
        <h2>Compara hasta cuatro proyectos por alcance, stack, metricas y riesgos.</h2>
        <p>Usa esta vista para priorizar que proyecto construir primero o para preparar una propuesta ejecutiva.</p>
      </div>
      <aside class="executive-card">
        <span>Seleccion</span>
        <strong>${selected.length} proyectos</strong>
        <p>Los favoritos sirven como curadoria, pero el comparador tiene su propia seleccion.</p>
      </aside>
    </header>
    <div class="detail-body">
      <section class="compare-selector" aria-label="Selector de comparacion">
        ${projects
          .map((project) => {
            const selectedProject = state.compareIds.has(project.id);
            return `
              <button type="button"
                class="${selectedProject ? "is-active" : ""}"
                style="--accent: ${escapeHtml(project.accent)}"
                data-compare-id="${escapeHtml(project.id)}">
                <span>${project.number}</span>
                <strong>${escapeHtml(project.shortTitle)}</strong>
              </button>
            `;
          })
          .join("")}
      </section>
      <section class="compare-table-wrap">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Dimension</th>
              ${selected.map((project) => `<th>${escapeHtml(project.shortTitle)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                ([key, label]) => `
                  <tr>
                    <th>${escapeHtml(label)}</th>
                    ${selected.map((project) => `<td>${escapeHtml(compareCell(project, key))}</td>`).join("")}
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </section>
    </div>
  `;
}

function renderHome() {
  const domains = domainStats();
  const maxDomain = Math.max(...domains.map((item) => item.count));
  const stacks = stackStats();
  const maxStack = Math.max(...stacks.map((item) => item.count));
  const favoriteProjects = projects.filter((project) => isFavorite(project.id));
  const featuredProjects = favoriteProjects.length ? favoriteProjects : projects.slice(0, 4);

  return `
    <header class="home-hero">
      <div>
        <p class="eyebrow">Vista ejecutiva</p>
        <h2>${projects.length} proyectos listos para presentar, desarrollar y empaquetar en web y Android.</h2>
        <p>El portfolio ya esta organizado como producto: cada caso incluye objetivo, metodologia, estructura de carpetas, metricas, entregables y un prompt maestro accionable.</p>
      </div>
      <aside class="executive-card">
        <span>Estado del paquete</span>
        <strong>Web + Android offline</strong>
        <p>Contenido compartido desde una unica fuente, exportacion Markdown y seleccion de favoritos por navegador o dispositivo.</p>
      </aside>
    </header>
    <div class="detail-body">
      <section class="kpi-grid">
        <article>
          <span>Proyectos</span>
          <strong>${projects.length}</strong>
          <p>casos avanzados desarrollados</p>
        </article>
        <article>
          <span>Dominios</span>
          <strong>${domains.length}</strong>
          <p>finanzas, PLN, vision, MLOps y mas</p>
        </article>
        <article>
          <span>Promedio</span>
          <strong>${averageHorizon()}</strong>
          <p>semanas por proyecto</p>
        </article>
        <article>
          <span>Favoritos</span>
          <strong>${state.favorites.size}</strong>
          <p>seleccion curada para priorizar</p>
        </article>
      </section>

      <section class="dashboard-grid">
        <div class="content-block visual-panel">
          <h3>Distribucion por dominio</h3>
          ${barRows(domains, maxDomain, "domain")}
        </div>
        <div class="content-block visual-panel">
          <h3>Stack mas repetido</h3>
          ${barRows(stacks, maxStack)}
        </div>
      </section>

      <section class="section-grid">
        <div class="content-block">
          <h3>${favoriteProjects.length ? "Favoritos guardados" : "Proyectos destacados"}</h3>
          <div class="quick-projects">
            ${featuredProjects
              .map(
                (project) => `
                  <button type="button" style="--accent: ${escapeHtml(project.accent)}" data-home-project-id="${escapeHtml(project.id)}">
                    <span>${project.number}</span>
                    <strong>${escapeHtml(project.shortTitle)}</strong>
                    <small>${escapeHtml(project.domain)}</small>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="content-block">
          <h3>Uso recomendado</h3>
          ${listMarkup([
            "Usar favoritos para armar una seleccion corta de proyectos prioritarios.",
            "Exportar todo para tener una carpeta documental o enviar el portfolio completo.",
            "Copiar el prompt maestro cuando quieras generar codigo, notebooks o dashboards por proyecto.",
            "Abrir Android Studio sobre la carpeta android para producir una APK offline con la misma experiencia."
          ])}
        </div>
      </section>
    </div>
  `;
}

function renderHeader(project) {
  const favorite = isFavorite(project.id);
  return `
    <header class="detail-header" style="--accent: ${escapeHtml(project.accent)}">
      <div>
        <div class="tag-row">
          <span class="pill">${escapeHtml(project.domain)}</span>
          <span class="pill">${escapeHtml(project.level)}</span>
          <span class="pill">${escapeHtml(statusLabel(project.status))}</span>
          ${project.source === "custom" ? '<span class="pill">Proyecto editable</span>' : '<span class="pill">Plantilla base</span>'}
        </div>
        <h2>${escapeHtml(project.title)}</h2>
        <p>${escapeHtml(project.objective)}</p>
        <button class="favorite-detail-button ${favorite ? "is-active" : ""}"
          type="button"
          data-toggle-favorite="${escapeHtml(project.id)}">
          ${favorite ? "Quitar de favoritos" : "Guardar como favorito"}
        </button>
      </div>
      <aside class="status-panel">
        <div>
          <span>Horizonte</span>
          <strong>${escapeHtml(project.horizon)}</strong>
        </div>
        <div>
          <span>Metricas clave</span>
          <strong>${project.metrics.slice(0, 2).map(escapeHtml).join(" / ")}</strong>
        </div>
        <div>
          <span>Stack base</span>
          <strong>${project.stack.slice(0, 3).map(escapeHtml).join(", ")}</strong>
        </div>
        <div>
          <span>Score</span>
          <strong>${scoreFor(project).total}/100</strong>
        </div>
      </aside>
    </header>
  `;
}

function renderBlueprint(project) {
  const starter = project.starterCode.length
    ? `<section class="content-block">
        <h3>Codigo base</h3>
        <pre class="code-box">${escapeHtml(project.starterCode.join("\n"))}</pre>
      </section>`
    : "";

  const example = project.exampleOutput
    ? `<section class="content-block">
        <h3>Ejemplo de salida</h3>
        <pre class="code-box">${escapeHtml(JSON.stringify(project.exampleOutput, null, 2))}</pre>
      </section>`
    : "";

  return `
    ${renderHeader(project)}
    <div class="detail-body" style="--accent: ${escapeHtml(project.accent)}">
      <section class="content-block">
        <h3>Resumen</h3>
        <p>${escapeHtml(project.summary)}</p>
      </section>
      ${renderScore(project)}
      ${renderChecklist(project)}
      <section class="section-grid">
        <div class="content-block">
          <h3>Desafios</h3>
          ${listMarkup(project.challenge)}
        </div>
        <div class="content-block">
          <h3>Metodologia</h3>
          ${listMarkup(project.methodology)}
        </div>
      </section>
      <section class="section-grid">
        <div class="content-block">
          <h3>Entregables</h3>
          ${listMarkup(project.deliverables)}
        </div>
        <div class="content-block">
          <h3>Criterios de aceptacion</h3>
          ${listMarkup(project.acceptance)}
        </div>
      </section>
      <section class="section-grid">
        <div class="content-block">
          <h3>Metricas</h3>
          ${pillMarkup(project.metrics)}
        </div>
        <div class="content-block">
          <h3>Stack sugerido</h3>
          <div class="stack-row">${project.stack.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}</div>
        </div>
      </section>
      <section class="content-block">
        <h3>Estructura de carpetas</h3>
        <pre class="folder-tree">${escapeHtml(buildFolderTree(project))}</pre>
      </section>
      ${starter}
      ${example}
    </div>
  `;
}

function renderPrompt(project) {
  return `
    ${renderHeader(project)}
    <div class="detail-body" style="--accent: ${escapeHtml(project.accent)}">
      <section class="content-block">
        <h3>Prompt maestro</h3>
        <pre class="prompt-box">${escapeHtml(buildPrompt(project))}</pre>
      </section>
    </div>
  `;
}

function renderMobile(project) {
  return `
    ${renderHeader(project)}
    <div class="detail-body mobile-layout" style="--accent: ${escapeHtml(project.accent)}">
      <div class="phone-frame" aria-hidden="true">
        <div class="phone-screen">
          <div class="phone-top">
            <span>${escapeHtml(project.domain)}</span>
            <strong>${escapeHtml(project.shortTitle)}</strong>
          </div>
          <div class="phone-content">
            <div class="phone-item">
              <strong>Objetivo</strong>
              <span>${escapeHtml(project.objective)}</span>
            </div>
            <div class="phone-item">
              <strong>Metricas</strong>
              <span>${escapeHtml(project.metrics.join(", "))}</span>
            </div>
            <div class="phone-item">
              <strong>Entregables</strong>
              <span>${escapeHtml(project.deliverables.slice(0, 2).join(" | "))}</span>
            </div>
          </div>
        </div>
      </div>
      <section class="content-block">
        <h3>Version Android</h3>
        <p>La version Android incluida en este proyecto carga esta misma aplicacion desde assets locales mediante WebView, por lo que funciona offline y mantiene el contenido sincronizado con la app web.</p>
        ${listMarkup([
          "Entrada directa al catalogo con busqueda, filtros y fichas tecnicas.",
          "Prompts profesionales disponibles para copiar y reutilizar.",
          "Assets estaticos empaquetados en android/app/src/main/assets/web.",
          "Actividad nativa con soporte de JavaScript, almacenamiento local y navegacion atras."
        ])}
      </section>
    </div>
  `;
}

function arrayText(items) {
  return (items || []).join("\n");
}

function renderEditor(project) {
  const score = scoreFor(project);
  const isCustom = project.source === "custom";

  return `
    ${renderHeader(project)}
    <form class="detail-body editor-form" data-editor-form style="--accent: ${escapeHtml(project.accent)}">
      <section class="editor-toolbar">
        <div>
          <span>Modo de edicion</span>
          <strong>${isCustom ? "Proyecto personalizado editable" : "Plantilla base: guardar crea una copia editable"}</strong>
        </div>
        <div class="editor-actions">
          <button class="ghost-button local-button" type="button" data-editor-duplicate>Duplicar plantilla</button>
          <button class="ghost-button local-button" type="button" data-editor-export-json>Exportar JSON</button>
          ${isCustom ? '<button class="danger-button" type="button" data-editor-delete>Eliminar</button>' : ""}
          <button class="primary-button local-button" type="submit">${isCustom ? "Guardar cambios" : "Guardar como copia"}</button>
        </div>
      </section>

      ${renderScore(project)}

      <section class="editor-grid">
        <label>
          <span>Titulo</span>
          <input name="title" required value="${escapeHtml(project.title)}">
        </label>
        <label>
          <span>Titulo corto</span>
          <input name="shortTitle" required value="${escapeHtml(project.shortTitle)}">
        </label>
        <label>
          <span>Dominio</span>
          <input name="domain" required value="${escapeHtml(project.domain)}">
        </label>
        <label>
          <span>Nivel</span>
          <input name="level" required value="${escapeHtml(project.level)}">
        </label>
        <label>
          <span>Horizonte</span>
          <input name="horizon" required value="${escapeHtml(project.horizon)}">
        </label>
        <label>
          <span>Color</span>
          <input name="accent" type="color" value="${escapeHtml(project.accent)}">
        </label>
        <label>
          <span>Estado</span>
          <select name="status">
            ${STATUS_OPTIONS.map((option) => `<option value="${option.value}" ${project.status === option.value ? "selected" : ""}>${option.label}</option>`).join("")}
          </select>
        </label>
      </section>

      <section class="editor-grid two-col">
        <label>
          <span>Objetivo</span>
          <textarea name="objective" rows="5" required>${escapeHtml(project.objective)}</textarea>
        </label>
        <label>
          <span>Resumen ejecutivo</span>
          <textarea name="summary" rows="5" required>${escapeHtml(project.summary)}</textarea>
        </label>
      </section>

      <section class="editor-grid two-col">
        <label>
          <span>Desafios</span>
          <textarea name="challenge" rows="7">${escapeHtml(arrayText(project.challenge))}</textarea>
        </label>
        <label>
          <span>Metodologia</span>
          <textarea name="methodology" rows="7">${escapeHtml(arrayText(project.methodology))}</textarea>
        </label>
        <label>
          <span>Entregables</span>
          <textarea name="deliverables" rows="7">${escapeHtml(arrayText(project.deliverables))}</textarea>
        </label>
        <label>
          <span>Criterios de aceptacion</span>
          <textarea name="acceptance" rows="7">${escapeHtml(arrayText(project.acceptance))}</textarea>
        </label>
        <label>
          <span>Metricas</span>
          <textarea name="metrics" rows="5">${escapeHtml(arrayText(project.metrics))}</textarea>
        </label>
        <label>
          <span>Stack</span>
          <textarea name="stack" rows="5">${escapeHtml(arrayText(project.stack))}</textarea>
        </label>
      </section>

      <section class="editor-grid">
        <label>
          <span>Estructura de carpetas</span>
          <textarea name="folderTree" rows="9">${escapeHtml(arrayText(project.folderTree))}</textarea>
        </label>
      </section>

      <section class="content-block">
        <h3>Lectura del score</h3>
        ${listMarkup([
          `Completitud: ${score.completeness}/100 segun campos obligatorios y listas tecnicas.`,
          `Claridad: ${score.clarity}/100 segun objetivo, resumen y desafios.`,
          `Viabilidad: ${score.feasibility}/100 segun horizonte, stack, metricas y criterios.`,
          `Valor: ${score.value}/100 segun entregables, metodologia y caso de uso.`
        ])}
      </section>
    </form>
  `;
}

function renderDetail() {
  if (state.tab === "home") {
    projectDetail.innerHTML = renderHome();
    return;
  }

  if (state.tab === "compare") {
    projectDetail.innerHTML = renderCompare();
    return;
  }

  const project = activeProject();
  if (!project) return;

  if (state.tab === "prompt") {
    projectDetail.innerHTML = renderPrompt(project);
  } else if (state.tab === "roadmap") {
    projectDetail.innerHTML = renderRoadmap(project);
  } else if (state.tab === "editor") {
    projectDetail.innerHTML = renderEditor(project);
  } else if (state.tab === "mobile") {
    projectDetail.innerHTML = renderMobile(project);
  } else {
    projectDetail.innerHTML = renderBlueprint(project);
  }
}

function renderTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === state.tab);
  });
}

function render() {
  renderStats();
  renderCards();
  renderTabs();
  renderDetail();
  syncUrl();
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function exportMarkdown(project) {
  return exportMarkdownFile(`${project.id}.md`, markdownFor(project), `${project.shortTitle}.md`);
}

function exportMarkdownFile(filename, markdown, androidTitle = filename, mime = "text/markdown;charset=utf-8") {
  if (window.AndroidBridge && typeof window.AndroidBridge.shareText === "function") {
    window.AndroidBridge.shareText(androidTitle, markdown);
    return "shared";
  }

  const blob = new Blob([markdown], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}

function exportAllMarkdown() {
  return exportMarkdownFile("portfolio-proyectos-analiticos.md", markdownForPortfolio());
}

function exportProjectJson(project) {
  return exportMarkdownFile(
    `${project.id}.json`,
    JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), project }, null, 2),
    `${project.shortTitle}.json`,
    "application/json;charset=utf-8"
  );
}

function formProjectPayload(form, currentProject) {
  const data = new FormData(form);
  return normalizeProject(
    {
      id: currentProject.source === "custom" ? currentProject.id : `custom-${slugify(data.get("shortTitle") || data.get("title"))}-${Date.now()}`,
      number: currentProject.source === "custom" ? currentProject.number : nextProjectNumber(),
      title: data.get("title"),
      shortTitle: data.get("shortTitle"),
      domain: data.get("domain"),
      level: data.get("level"),
      horizon: data.get("horizon"),
      accent: data.get("accent"),
      objective: data.get("objective"),
      summary: data.get("summary"),
      challenge: data.get("challenge"),
      folderTree: data.get("folderTree"),
      methodology: data.get("methodology"),
      deliverables: data.get("deliverables"),
      metrics: data.get("metrics"),
      stack: data.get("stack"),
      acceptance: data.get("acceptance"),
      status: data.get("status")
    },
    "custom",
    projects.length
  );
}

function upsertCustomProject(project) {
  const normalized = normalizeProject(project, "custom", projects.length);
  const index = state.customProjects.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    state.customProjects[index] = normalized;
  } else {
    state.customProjects.push(normalized);
  }
  saveCustomProjects();
  refreshProjects();
  renderDomainFilter();
  renderStatusFilter();
  state.activeId = normalized.id;
  localStorage.setItem(STORAGE_KEYS.activeProject, state.activeId);
}

function createNewProject() {
  const project = blankProject();
  upsertCustomProject(project);
  state.tab = "editor";
  render();
  showToast("Proyecto nuevo creado.");
}

function duplicateProject(project = activeProject()) {
  const duplicate = cloneProjectForCustom(project);
  upsertCustomProject(duplicate);
  state.tab = "editor";
  render();
  showToast("Proyecto duplicado como plantilla editable.");
}

function deleteCustomProject(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project || project.source !== "custom") {
    showToast("Las plantillas base no se eliminan.");
    return;
  }

  state.customProjects = state.customProjects.filter((item) => item.id !== projectId);
  delete state.checklist[projectId];
  delete state.plan[projectId];
  state.favorites.delete(projectId);
  state.compareIds.delete(projectId);
  saveCustomProjects();
  saveChecklist();
  savePlan();
  saveFavorites();
  saveCompareIds();
  refreshProjects();
  renderDomainFilter();
  renderStatusFilter();
  state.activeId = projects[0]?.id;
  localStorage.setItem(STORAGE_KEYS.activeProject, state.activeId);
  render();
  showToast("Proyecto personalizado eliminado.");
}

function importProjectsFromPayload(payload) {
  const rawProjects = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.projects)
      ? payload.projects
      : payload.project
        ? [payload.project]
        : [];

  if (!rawProjects.length) {
    showToast("El JSON no contiene proyectos importables.");
    return;
  }

  const imported = rawProjects.map((project, index) => {
    const normalized = normalizeProject(project, "custom", projects.length + index);
    normalized.id = `custom-${slugify(normalized.shortTitle || normalized.title)}-${Date.now()}-${index}`;
    normalized.number = nextProjectNumber() + index;
    normalized.source = "custom";
    return normalized;
  });

  state.customProjects.push(...imported);
  saveCustomProjects();
  refreshProjects();
  renderDomainFilter();
  renderStatusFilter();
  state.activeId = imported[0].id;
  state.tab = "editor";
  localStorage.setItem(STORAGE_KEYS.activeProject, state.activeId);
  render();
  showToast(`${imported.length} proyecto(s) importado(s).`);
}

projectList.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite-id]");
  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favoriteId);
    showToast(isFavorite(favoriteButton.dataset.favoriteId) ? "Favorito guardado." : "Favorito quitado.");
    return;
  }

  const card = event.target.closest("[data-project-id]");
  if (!card) return;
  state.activeId = card.dataset.projectId;
  state.tab = state.tab === "home" ? "blueprint" : state.tab;
  localStorage.setItem(STORAGE_KEYS.activeProject, state.activeId);
  render();
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  syncUrl();
  renderCards();
});

domainFilter.addEventListener("change", (event) => {
  state.domain = event.target.value;
  syncUrl();
  renderCards();
});

statusFilter.addEventListener("change", (event) => {
  state.status = event.target.value;
  syncUrl();
  renderCards();
});

favoritesOnly.addEventListener("change", (event) => {
  state.favoritesOnly = event.target.checked;
  syncUrl();
  renderCards();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    state.tab = tab.dataset.tab;
    render();
  });
});

projectDetail.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-toggle-favorite]");
  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.toggleFavorite);
    showToast(isFavorite(favoriteButton.dataset.toggleFavorite) ? "Favorito guardado." : "Favorito quitado.");
    return;
  }

  const compareButton = event.target.closest("[data-compare-id]");
  if (compareButton) {
    toggleCompare(compareButton.dataset.compareId);
    return;
  }

  const duplicateEditorButton = event.target.closest("[data-editor-duplicate]");
  if (duplicateEditorButton) {
    duplicateProject(activeProject());
    return;
  }

  const exportEditorButton = event.target.closest("[data-editor-export-json]");
  if (exportEditorButton) {
    const result = exportProjectJson(activeProject());
    showToast(result === "shared" ? "JSON enviado a Android." : "JSON exportado.");
    return;
  }

  const deleteEditorButton = event.target.closest("[data-editor-delete]");
  if (deleteEditorButton) {
    deleteCustomProject(activeProject().id);
    return;
  }

  const projectButton = event.target.closest("[data-home-project-id]");
  if (!projectButton) return;
  state.activeId = projectButton.dataset.homeProjectId;
  state.tab = "blueprint";
  localStorage.setItem(STORAGE_KEYS.activeProject, state.activeId);
  render();
});

projectDetail.addEventListener("change", (event) => {
  const checklistInput = event.target.closest("[data-checklist-project]");
  if (checklistInput) {
    toggleChecklist(checklistInput.dataset.checklistProject, checklistInput.dataset.checklistItem, checklistInput.checked);
    return;
  }

  const planInput = event.target.closest("[data-plan-project]");
  if (planInput) {
    togglePlan(planInput.dataset.planProject, planInput.dataset.planItem, planInput.checked);
  }
});

projectDetail.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-editor-form]");
  if (!form) return;
  event.preventDefault();
  const savedProject = formProjectPayload(form, activeProject());
  upsertCustomProject(savedProject);
  state.tab = "editor";
  render();
  showToast(activeProject().source === "custom" ? "Proyecto guardado." : "Copia editable creada.");
});

copyPromptButton.addEventListener("click", async () => {
  const project = activeProject();
  await copyText(buildPrompt(project));
  showToast("Prompt copiado.");
});

exportButton.addEventListener("click", () => {
  const result = exportMarkdown(activeProject());
  showToast(result === "shared" ? "Ficha enviada a Android." : "Ficha exportada en Markdown.");
});

exportAllButton.addEventListener("click", () => {
  const result = exportAllMarkdown();
  showToast(result === "shared" ? "Portfolio enviado a Android." : "Portfolio exportado en Markdown.");
});

themeToggleButton.addEventListener("click", () => {
  setTheme(state.theme === "dark" ? "light" : "dark");
});

copyLinkButton.addEventListener("click", async () => {
  syncUrl();
  await copyText(currentUrl());
  showToast("Enlace copiado.");
});

printButton.addEventListener("click", () => {
  window.print();
});

newProjectButton.addEventListener("click", () => {
  createNewProject();
});

duplicateProjectButton.addEventListener("click", () => {
  duplicateProject(activeProject());
});

exportJsonButton.addEventListener("click", () => {
  const result = exportProjectJson(activeProject());
  showToast(result === "shared" ? "JSON enviado a Android." : "JSON exportado.");
});

importJsonButton.addEventListener("click", () => {
  importJsonInput.click();
});

importJsonInput.addEventListener("change", () => {
  const file = importJsonInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      importProjectsFromPayload(JSON.parse(String(reader.result || "{}")));
    } catch {
      showToast("No se pudo leer el JSON.");
    } finally {
      importJsonInput.value = "";
    }
  });
  reader.readAsText(file);
});

function boot() {
  try {
    const savedCustomProjects = JSON.parse(localStorage.getItem(STORAGE_KEYS.customProjects) || "[]");
    state.customProjects = Array.isArray(savedCustomProjects)
      ? savedCustomProjects.map((project, index) => normalizeProject(project, "custom", baseProjects.length + index))
      : [];
  } catch {
    state.customProjects = [];
  }

  try {
    state.checklist = JSON.parse(localStorage.getItem(STORAGE_KEYS.checklist) || "{}");
  } catch {
    state.checklist = {};
  }

  try {
    state.plan = JSON.parse(localStorage.getItem(STORAGE_KEYS.plan) || "{}");
  } catch {
    state.plan = {};
  }

  refreshProjects();

  try {
    const savedFavorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || "[]");
    state.favorites = new Set(savedFavorites.filter((id) => projects.some((project) => project.id === id)));
  } catch {
    state.favorites = new Set();
  }

  try {
    const savedCompare = JSON.parse(localStorage.getItem(STORAGE_KEYS.compare) || "[]");
    state.compareIds = new Set(savedCompare.filter((id) => projects.some((project) => project.id === id)).slice(0, 4));
  } catch {
    state.compareIds = new Set();
  }

  if (!state.compareIds.size) {
    projects.slice(0, 3).forEach((project) => state.compareIds.add(project.id));
    saveCompareIds();
  }

  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  setTheme(savedTheme || "dark");

  renderDomainFilter();
  renderStatusFilter();
  renderStats();
  const savedId = localStorage.getItem(STORAGE_KEYS.activeProject);
  state.activeId = projects.some((project) => project.id === savedId) ? savedId : projects[0]?.id;
  applyUrlState();
  renderDomainFilter();
  renderStatusFilter();
  render();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

boot();
