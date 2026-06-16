const STORAGE_KEY = "megazzonia.energySimulator.v2";

const categoryColors = {
  Climatizacion: "#61d394",
  Cocina: "#d98a5f",
  Iluminacion: "#f0c86a",
  Computo: "#45b6c9",
  Lavado: "#b0845f",
  Otros: "#9fb6a7",
};

const presets = [
  {
    id: "home",
    label: "Casa eficiente",
    tariff: 0.15,
    threshold: 260,
    devices: [
      device("Heladera inverter", "Cocina", 120, 24, 30),
      device("Iluminacion LED", "Iluminacion", 90, 5, 30),
      device("Notebook", "Computo", 65, 7, 24),
      device("Lavarropas", "Lavado", 500, 1, 12),
    ],
  },
  {
    id: "apartment",
    label: "Departamento",
    tariff: 0.17,
    threshold: 320,
    devices: [
      device("Aire split", "Climatizacion", 950, 5, 24),
      device("Heladera", "Cocina", 160, 24, 30),
      device("TV + consola", "Computo", 180, 4, 25),
      device("Iluminacion", "Iluminacion", 140, 5, 30),
    ],
  },
  {
    id: "workshop",
    label: "Taller tecnico",
    tariff: 0.22,
    threshold: 520,
    devices: [
      device("Compresor", "Otros", 1500, 2, 20),
      device("Soldadora", "Otros", 2600, 0.8, 16),
      device("Banco de pruebas", "Computo", 600, 6, 22),
      device("Extractor", "Climatizacion", 380, 5, 22),
    ],
  },
  {
    id: "studio",
    label: "Setup creativo",
    tariff: 0.2,
    threshold: 420,
    devices: [
      device("PC workstation", "Computo", 650, 8, 24),
      device("Monitores", "Computo", 130, 8, 24),
      device("Aire acondicionado", "Climatizacion", 1100, 4, 22),
      device("Iluminacion estudio", "Iluminacion", 240, 5, 18),
    ],
  },
];

let state = {
  scenario: "Casa eficiente",
  tariff: 0.15,
  threshold: 300,
  devices: presets[0].devices.map(cloneDevice),
  history: [],
};

let elements;

document.addEventListener("DOMContentLoaded", () => {
  elements = cacheElements();
  loadState();
  bindEvents();
  renderPresets();
  renderAll();
});

function cacheElements() {
  return {
    presetGrid: document.getElementById("presetGrid"),
    deviceForm: document.getElementById("deviceForm"),
    deviceName: document.getElementById("deviceName"),
    deviceCategory: document.getElementById("deviceCategory"),
    devicePower: document.getElementById("devicePower"),
    deviceHours: document.getElementById("deviceHours"),
    deviceDays: document.getElementById("deviceDays"),
    tariff: document.getElementById("tariff"),
    threshold: document.getElementById("threshold"),
    deviceList: document.getElementById("deviceList"),
    deviceCount: document.getElementById("deviceCount"),
    metricKwh: document.getElementById("metricKwh"),
    metricCost: document.getElementById("metricCost"),
    metricTariff: document.getElementById("metricTariff"),
    metricTop: document.getElementById("metricTop"),
    metricTopShare: document.getElementById("metricTopShare"),
    metricStatus: document.getElementById("metricStatus"),
    metricStatusDetail: document.getElementById("metricStatusDetail"),
    barChart: document.getElementById("barChart"),
    donutChart: document.getElementById("donutChart"),
    historyBody: document.getElementById("historyBody"),
    insights: document.getElementById("insights"),
    scenarioName: document.getElementById("scenarioName"),
    saveSnapshot: document.getElementById("saveSnapshot"),
    exportSummary: document.getElementById("exportSummary"),
    exportCsv: document.getElementById("exportCsv"),
    clearDevices: document.getElementById("clearDevices"),
    clearHistory: document.getElementById("clearHistory"),
  };
}

function bindEvents() {
  elements.deviceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addDeviceFromForm();
  });

  [elements.tariff, elements.threshold].forEach((input) => {
    input.addEventListener("input", () => {
      state.tariff = numberValue(elements.tariff.value, 0);
      state.threshold = numberValue(elements.threshold.value, 1);
      persist();
      renderAll();
    });
  });

  elements.saveSnapshot.addEventListener("click", saveSnapshot);
  elements.exportSummary.addEventListener("click", exportSummary);
  elements.exportCsv.addEventListener("click", exportCsv);
  elements.clearDevices.addEventListener("click", clearDevices);
  elements.clearHistory.addEventListener("click", clearHistory);

  window.addEventListener("resize", debounce(renderCharts, 120));
}

function renderPresets() {
  elements.presetGrid.innerHTML = presets
    .map((preset) => `<button type="button" data-preset="${preset.id}">${preset.label}</button>`)
    .join("");

  elements.presetGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    applyPreset(button.dataset.preset);
  });
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = {
        ...state,
        ...parsed,
        devices: Array.isArray(parsed.devices) ? parsed.devices.map(normalizeDevice) : state.devices,
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
      return;
    } catch (error) {
      console.warn("Could not load saved energy simulator state", error);
    }
  }

  const oldDevices = localStorage.getItem("devices");
  if (oldDevices) {
    try {
      state.devices = JSON.parse(oldDevices).map((item) =>
        device(item.name || "Equipo", "Otros", Number(item.power) || 1, Number(item.hours) || 1, 30)
      );
      state.scenario = "Migrado";
    } catch (error) {
      console.warn("Could not migrate legacy devices", error);
    }
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyPreset(id) {
  const preset = presets.find((item) => item.id === id);
  if (!preset) return;

  state.scenario = preset.label;
  state.tariff = preset.tariff;
  state.threshold = preset.threshold;
  state.devices = preset.devices.map(cloneDevice);
  persist();
  renderAll();
}

function addDeviceFromForm() {
  const nextDevice = device(
    elements.deviceName.value.trim(),
    elements.deviceCategory.value,
    numberValue(elements.devicePower.value, 0),
    numberValue(elements.deviceHours.value, 0),
    numberValue(elements.deviceDays.value, 0)
  );

  if (!nextDevice.name || nextDevice.power <= 0 || nextDevice.hours <= 0 || nextDevice.days <= 0) {
    return;
  }

  state.devices.push(nextDevice);
  state.scenario = "Personalizado";
  elements.deviceForm.reset();
  elements.devicePower.value = 900;
  elements.deviceHours.value = 4;
  elements.deviceDays.value = 30;
  persist();
  renderAll();
}

function removeDevice(id) {
  state.devices = state.devices.filter((item) => item.id !== id);
  state.scenario = "Personalizado";
  persist();
  renderAll();
}

function duplicateDevice(id) {
  const source = state.devices.find((item) => item.id === id);
  if (!source) return;

  state.devices.push({
    ...cloneDevice(source),
    id: createId(),
    name: `${source.name} copia`,
  });
  state.scenario = "Personalizado";
  persist();
  renderAll();
}

function clearDevices() {
  state.devices = [];
  state.scenario = "Vacio";
  persist();
  renderAll();
}

function clearHistory() {
  state.history = [];
  persist();
  renderHistory(computeSummary());
}

function saveSnapshot() {
  const summary = computeSummary();
  if (!summary.devices.length) return;

  state.history.unshift({
    id: createId(),
    date: new Date().toLocaleString(),
    scenario: state.scenario,
    kwh: round(summary.totalKwh),
    cost: round(summary.cost),
    top: summary.topDevice ? summary.topDevice.name : "Sin datos",
  });

  state.history = state.history.slice(0, 24);
  persist();
  renderHistory(summary);
}

function exportSummary() {
  const summary = computeSummary();
  const lines = [
    "Simulador de Consumo Electrico",
    `Escenario: ${state.scenario}`,
    `Consumo mensual: ${round(summary.totalKwh)} kWh`,
    `Costo mensual: $${round(summary.cost)}`,
    `Tarifa: $${state.tariff}/kWh`,
    `Umbral: ${state.threshold} kWh`,
    "",
    "Equipos",
    ...summary.devices.map(
      (item) =>
        `${item.name}, ${item.category}, ${item.power} W, ${item.hours} h/dia, ${item.days} dias, ${round(item.kwh)} kWh`
    ),
  ];

  downloadBlob(lines.join("\n"), "resumen_consumo_electrico.txt", "text/plain;charset=utf-8");
}

function exportCsv() {
  const rows = [["Fecha", "Escenario", "kWh", "Costo", "Top equipo"]];
  state.history.forEach((item) => {
    rows.push([item.date, item.scenario, item.kwh, item.cost, item.top]);
  });

  downloadBlob(rows.map((row) => row.map(csvCell).join(",")).join("\n"), "historial_consumo.csv", "text/csv;charset=utf-8");
}

function renderAll() {
  elements.tariff.value = state.tariff;
  elements.threshold.value = state.threshold;
  elements.scenarioName.textContent = state.scenario;

  const summary = computeSummary();
  renderMetrics(summary);
  renderDevices(summary);
  renderCharts();
  renderInsights(summary);
  renderHistory(summary);
}

function renderMetrics(summary) {
  elements.metricKwh.textContent = round(summary.totalKwh);
  elements.metricCost.textContent = money(summary.cost);
  elements.metricTariff.textContent = `Tarifa: ${money(state.tariff)}/kWh`;

  if (summary.topDevice) {
    elements.metricTop.textContent = shortLabel(summary.topDevice.name, 18);
    elements.metricTopShare.textContent = `${round(summary.topShare)}% del total`;
  } else {
    elements.metricTop.textContent = "Sin datos";
    elements.metricTopShare.textContent = "0% del total";
  }

  const overThreshold = summary.totalKwh > state.threshold;
  elements.metricStatus.textContent = overThreshold ? "Alerta" : "OK";
  elements.metricStatus.style.color = overThreshold ? "var(--warning)" : "var(--ok)";
  elements.metricStatusDetail.textContent = overThreshold
    ? `${round(summary.totalKwh - state.threshold)} kWh sobre el umbral`
    : `${round(state.threshold - summary.totalKwh)} kWh disponibles`;
}

function renderDevices(summary) {
  elements.deviceCount.textContent = `${summary.devices.length} equipos`;

  if (!summary.devices.length) {
    elements.deviceList.innerHTML = '<div class="empty-state">No hay equipos cargados.</div>';
    return;
  }

  elements.deviceList.innerHTML = summary.devices
    .map(
      (item) => `
        <article class="device-row">
          <div class="device-main">
            <div class="device-title">
              <span style="background:${categoryColors[item.category] || categoryColors.Otros}"></span>
              ${escapeHtml(item.name)}
            </div>
            <div class="device-meta">
              ${escapeHtml(item.category)} | ${item.power} W | ${item.hours} h/dia | ${item.days} dias/mes
              <strong class="device-kwh">${round(item.kwh)} kWh</strong>
            </div>
          </div>
          <div class="device-actions">
            <button type="button" data-duplicate="${item.id}">Duplicar</button>
            <button class="btn-danger" type="button" data-remove="${item.id}">Quitar</button>
          </div>
        </article>
      `
    )
    .join("");

  elements.deviceList.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removeDevice(button.dataset.remove));
  });
  elements.deviceList.querySelectorAll("[data-duplicate]").forEach((button) => {
    button.addEventListener("click", () => duplicateDevice(button.dataset.duplicate));
  });
}

function renderCharts() {
  const summary = computeSummary();
  drawBarChart(elements.barChart, summary.devices);
  drawDonutChart(elements.donutChart, summary.byCategory, summary.totalKwh);
}

function renderInsights(summary) {
  const insights = [];
  const top = summary.topDevice;

  if (!summary.devices.length) {
    elements.insights.innerHTML = '<div class="empty-state">Carga equipos o aplica un preset.</div>';
    return;
  }

  if (top) {
    insights.push({
      title: "Equipo critico",
      text: `${top.name} concentra ${round(summary.topShare)}% del consumo mensual. Reducir una hora diaria ahorra ${round(
        (top.power / 1000) * top.days
      )} kWh/mes.`,
    });
  }

  const climatization = summary.byCategory.Climatizacion || 0;
  if (climatization / Math.max(summary.totalKwh, 1) > 0.35) {
    insights.push({
      title: "Climatizacion dominante",
      text: "La climatizacion supera el 35% del total. Vale revisar temperatura objetivo, aislamiento y horas de uso.",
    });
  }

  if (summary.totalKwh > state.threshold) {
    insights.push({
      title: "Umbral superado",
      text: `El escenario excede el umbral por ${round(summary.totalKwh - state.threshold)} kWh. El ajuste debe concentrarse en los primeros equipos del ranking.`,
    });
  } else {
    insights.push({
      title: "Margen operativo",
      text: `Quedan ${round(state.threshold - summary.totalKwh)} kWh antes de llegar al umbral mensual configurado.`,
    });
  }

  const avgDaily = summary.totalKwh / 30;
  insights.push({
    title: "Promedio diario",
    text: `El escenario equivale a ${round(avgDaily)} kWh por dia y ${money(summary.cost / 30)} diarios con la tarifa actual.`,
  });

  elements.insights.innerHTML = insights
    .map(
      (item) => `
        <article class="insight">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.text)}</p>
        </article>
      `
    )
    .join("");
}

function renderHistory() {
  if (!state.history.length) {
    elements.historyBody.innerHTML = '<tr><td colspan="5">Sin lecturas guardadas.</td></tr>';
    return;
  }

  elements.historyBody.innerHTML = state.history
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.date)}</td>
          <td>${escapeHtml(item.scenario)}</td>
          <td>${round(item.kwh)}</td>
          <td>${money(item.cost)}</td>
          <td>${escapeHtml(item.top)}</td>
        </tr>
      `
    )
    .join("");
}

function computeSummary() {
  const devices = state.devices.map((item) => ({
    ...item,
    kwh: (item.power * item.hours * item.days) / 1000,
  }));

  devices.sort((a, b) => b.kwh - a.kwh);

  const totalKwh = devices.reduce((sum, item) => sum + item.kwh, 0);
  const cost = totalKwh * state.tariff;
  const topDevice = devices[0] || null;
  const topShare = topDevice && totalKwh ? (topDevice.kwh / totalKwh) * 100 : 0;
  const byCategory = devices.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.kwh;
    return acc;
  }, {});

  return { devices, totalKwh, cost, topDevice, topShare, byCategory };
}

function drawBarChart(canvas, devices) {
  const ctx = prepareCanvas(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(7, 17, 14, 0.35)";
  ctx.fillRect(0, 0, width, height);

  if (!devices.length) {
    drawEmptyChart(ctx, width, height, "Sin equipos para graficar");
    return;
  }

  const padding = { top: 24, right: 18, bottom: 72, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(...devices.map((item) => item.kwh), 1);
  const barGap = 10;
  const barWidth = Math.max(18, (chartWidth - barGap * (devices.length - 1)) / devices.length);

  drawGrid(ctx, padding, chartWidth, chartHeight, max);

  devices.forEach((item, index) => {
    const x = padding.left + index * (barWidth + barGap);
    const barHeight = (item.kwh / max) * chartHeight;
    const y = padding.top + chartHeight - barHeight;
    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
    gradient.addColorStop(0, categoryColors[item.category] || categoryColors.Otros);
    gradient.addColorStop(1, "rgba(176, 132, 95, 0.72)");
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, barWidth, barHeight, 6);
    ctx.fill();
    ctx.fillStyle = "#ecf7ef";
    ctx.font = "700 12px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(round(item.kwh), x + barWidth / 2, Math.max(16, y - 8));
    ctx.save();
    ctx.translate(x + barWidth / 2, height - 18);
    ctx.rotate(-Math.PI / 5);
    ctx.fillStyle = "#9eb3a6";
    ctx.font = "700 11px Segoe UI, sans-serif";
    ctx.fillText(shortLabel(item.name, 12), 0, 0);
    ctx.restore();
  });
}

function drawGrid(ctx, padding, chartWidth, chartHeight, max) {
  ctx.strokeStyle = "rgba(97, 211, 148, 0.12)";
  ctx.fillStyle = "#9eb3a6";
  ctx.font = "11px Segoe UI, sans-serif";
  ctx.textAlign = "right";

  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (chartHeight / 4) * i;
    const value = max - (max / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
    ctx.fillText(round(value), padding.left - 8, y + 4);
  }
}

function drawDonutChart(canvas, byCategory, totalKwh) {
  const ctx = prepareCanvas(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(7, 17, 14, 0.35)";
  ctx.fillRect(0, 0, width, height);

  const entries = Object.entries(byCategory).filter(([, value]) => value > 0);
  if (!entries.length) {
    drawEmptyChart(ctx, width, height, "Sin categorias para graficar");
    return;
  }

  const radius = Math.min(width, height) * 0.25;
  const centerX = width * 0.36;
  const centerY = height * 0.5;
  let startAngle = -Math.PI / 2;

  entries.forEach(([category, value]) => {
    const angle = (value / totalKwh) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.fillStyle = categoryColors[category] || categoryColors.Otros;
    ctx.fill();
    startAngle += angle;
  });

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = "#ecf7ef";
  ctx.font = "900 22px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(round(totalKwh), centerX, centerY - 4);
  ctx.fillStyle = "#9eb3a6";
  ctx.font = "700 12px Segoe UI, sans-serif";
  ctx.fillText("kWh/mes", centerX, centerY + 18);

  const legendX = width * 0.64;
  let legendY = 54;
  entries.forEach(([category, value]) => {
    ctx.fillStyle = categoryColors[category] || categoryColors.Otros;
    roundRect(ctx, legendX, legendY - 10, 12, 12, 3);
    ctx.fill();
    ctx.fillStyle = "#ecf7ef";
    ctx.font = "800 12px Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(category, legendX + 18, legendY);
    ctx.fillStyle = "#9eb3a6";
    ctx.font = "12px Segoe UI, sans-serif";
    ctx.fillText(`${round(value)} kWh`, legendX + 18, legendY + 16);
    legendY += 44;
  });
}

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawEmptyChart(ctx, width, height, text) {
  ctx.fillStyle = "#9eb3a6";
  ctx.font = "700 15px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, height / 2);
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function device(name, category, power, hours, days) {
  return {
    id: createId(),
    name,
    category,
    power,
    hours,
    days,
  };
}

function normalizeDevice(item) {
  return {
    id: item.id || createId(),
    name: item.name || "Equipo",
    category: item.category || "Otros",
    power: numberValue(item.power, 1),
    hours: numberValue(item.hours, 1),
    days: numberValue(item.days, 30),
  };
}

function cloneDevice(item) {
  return {
    ...normalizeDevice(item),
    id: createId(),
  };
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function numberValue(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value) {
  return Number(value).toFixed(2).replace(/\.00$/, "");
}

function money(value) {
  return `$${round(Number(value) || 0)}`;
}

function shortLabel(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}.` : value;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function debounce(fn, wait) {
  let timer;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, wait);
  };
}
