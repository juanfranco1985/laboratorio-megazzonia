import { getPrimaryMissionId } from '../data/missions.js';
import { getMissionDefinitionById, listMissionDefinitions } from './missions/missionRegistry.js';

function buildBundleAssets(definition) {
  const attachments = definition?.context?.attachments || [];
  const datasets = definition?.datasets || [];
  const datasetAssets = datasets.map((dataset, index) => ({
    id: dataset.id,
    name: dataset.name,
    kind: dataset.type,
    label: dataset.label,
    path: dataset.path,
    role: dataset.role || (index === 0 ? 'primary' : 'supporting'),
    tableName: dataset.tableName || null
  }));
  const datasetIds = new Set(datasetAssets.map((dataset) => dataset.id));

  return [
    ...datasetAssets,
    ...attachments
      .filter((attachment) => !datasetIds.has(attachment.id))
      .map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        kind: attachment.type,
        label: attachment.label,
        path: attachment.path
      })),
    {
      id: 'sales_clean_view',
      name: 'sales_clean',
      kind: 'virtual_table',
      label: 'normalized workspace',
      path: 'virtual://sales_clean'
    }
  ].filter(Boolean);
}

export function getDatasetDefinition(missionId = getPrimaryMissionId()) {
  const definition = getMissionDefinitionById(missionId);
  if (!definition) {
    return null;
  }

  return {
    id: definition.id,
    label: definition.title,
    kind: 'mission_bundle',
    previewLimit: 6,
    assets: buildBundleAssets(definition)
  };
}

export function listDatasetDefinitions() {
  return listMissionDefinitions().map((definition) => getDatasetDefinition(definition.id)).filter(Boolean);
}

export function listBundleAssets(missionId = getPrimaryMissionId()) {
  return [...(getDatasetDefinition(missionId)?.assets || [])];
}

export function getAssetDefinition(missionId, assetId) {
  return listBundleAssets(missionId).find((asset) => asset.id === assetId) || null;
}

export function getDefaultAssetId(missionId = getPrimaryMissionId()) {
  const assets = listBundleAssets(missionId);
  return assets.find((asset) => asset.role === 'primary')?.id || assets[0]?.id || null;
}

export function buildDatasetState(state, missionId = getPrimaryMissionId()) {
  const definition = getDatasetDefinition(missionId);
  const bundleState = state.files.bundleStates[missionId] || {
    status: 'locked',
    ready: false,
    rowCount: 0,
    qualityNotes: []
  };

  return {
    ...definition,
    status: bundleState.status,
    ready: bundleState.ready,
    rowCount: bundleState.rowCount,
    qualityNotes: bundleState.qualityNotes,
    active: state.files.activeBundleId === missionId,
    unlocked: state.files.unlockedBundleIds.includes(missionId)
  };
}
