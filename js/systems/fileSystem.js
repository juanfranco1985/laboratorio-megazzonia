import { formatNumber, titleCase, truncate } from "../app/utils.js";
import { getPrimaryMissionId } from "../data/missions.js";
import { getDatasetDefinition, getDefaultAssetId, listBundleAssets } from "./datasetRegistry.js";
import { advanceSimulationTime } from "./clockEngine.js";

function resolveBundleId(state, missionId) {
  return missionId || state.files.activeBundleId || state.analysis.loadedMissionId || state.missions.activeId || getPrimaryMissionId();
}

function getAssetNotes(asset, { unlocked, ready }) {
  if (asset.kind === 'csv') {
    if (!unlocked) {
      return 'Bloqueado hasta aceptar la misión';
    }
    return asset.role === 'supporting'
      ? `Tabla auxiliar disponible para JOIN${asset.tableName ? ` como ${asset.tableName}` : ''}`
      : 'Disponible para revisión y normalización';
  }
  if (asset.id === 'mission_json') {
    return 'Contexto narrativo y objetivos de negocio';
  }
  if (asset.id === 'schema_json') {
    return 'Estructura prevista para la importación';
  }
  if (asset.id === 'sales_clean_view') {
    return ready ? 'Vista normalizada lista para SQL' : 'Se construye al aceptar la misión';
  }
  return 'Activo interno';
}

export function buildFileCatalog(state, runtime = null, missionId = null) {
  const bundleId = resolveBundleId(state, missionId);
  const definition = getDatasetDefinition(bundleId);
  if (!definition) {
    return [];
  }

  const bundleState = state.files.bundleStates[bundleId] || {};
  const unlocked = state.files.unlockedBundleIds.includes(bundleId);
  const ready = Boolean(bundleState.ready);
  const summary = runtime?.summary || state.analysis.summary || {};
  const cachedPreview = state.files.previewCache[bundleId] || {};
  const rawPreview = runtime?.rawPreview || cachedPreview.rawPreview || [];
  const cleanPreview = runtime?.cleanPreview || cachedPreview.cleanPreview || [];
  const assetPreviews = runtime?.assetPreviews || cachedPreview.assetPreviews || {};
  const assetRowCounts = runtime?.assetRowCounts || cachedPreview.assetRowCounts || {};

  return listBundleAssets(bundleId).map((asset) => {
    const isCsv = asset.kind === "csv";
    const isRaw = asset.role === "primary" || asset.id === "sales_dirty_csv";
    const isClean = asset.id === "sales_clean_view";
    const isMissionMeta = asset.id === "mission_json" || asset.id === "schema_json";
    const preview = assetPreviews[asset.id] || (isRaw ? rawPreview : isClean ? cleanPreview : []);

    return {
      ...asset,
      status: isMissionMeta ? "available" : isClean ? (ready ? "ready" : unlocked ? "building" : "locked") : unlocked ? "unlocked" : "locked",
      ready: isMissionMeta ? true : isClean ? ready : unlocked,
      rowCount: assetRowCounts[asset.id] ?? (isRaw ? summary.rawRows || 0 : isClean ? summary.cleanRows || 0 : isCsv ? 0 : 1),
      preview,
      notes: getAssetNotes(asset, { unlocked, ready })
    };
  });
}

export function buildFileSummary(state, missionId = null) {
  const bundleId = resolveBundleId(state, missionId);
  const bundleState = state.files.bundleStates[bundleId] || {};
  return {
    bundleId,
    datasetStatus: bundleState.status || "locked",
    unlockedCount: state.files.unlockedBundleIds.length,
    activeBundleId: state.files.activeBundleId,
    rowCount: bundleState.rowCount || 0,
    qualityNotes: bundleState.qualityNotes || []
  };
}

export function selectDataset(store, assetId, bundleId = null) {
  store.setState((state) => {
    const resolvedBundleId = bundleId || state.files.activeBundleId || state.analysis.loadedMissionId || state.missions.activeId || getPrimaryMissionId();
    state.files.activeBundleId = resolvedBundleId;
    state.ui.selectedFileId = assetId || getDefaultAssetId(resolvedBundleId);
    state.ui.activeView = "files";
  });
  advanceSimulationTime(store, 'review_files');
}


export function fileStatusLabel(status) {
  switch (status) {
    case "locked":
      return "Bloqueado";
    case "building":
      return "Preparando";
    case "ready":
      return "Listo";
    case "unlocked":
      return "Disponible";
    case "available":
      return "Visible";
    default:
      return titleCase(status);
  }
}

export function formatQualityNotes(notes = []) {
  if (!notes.length) {
    return "Sin observaciones de calidad registradas.";
  }
  return notes.map((note) => truncate(note, 72)).join(" · ");
}

export function formatFileMetric(value) {
  if (typeof value === "number") {
    return formatNumber(value);
  }
  return value;
}
