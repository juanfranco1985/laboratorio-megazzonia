import { normalizeWord, slugify, uniqueStrings } from '../utils/helpers.js';

export class PackLoader {
  constructor(fetchImpl = globalThis.fetch?.bind(globalThis)) {
    this.fetchImpl = fetchImpl;
  }

  async loadManifestSources(manifestUrl) {
    if (!this.fetchImpl) {
      return [];
    }

    try {
      const response = await this.fetchImpl(manifestUrl, { cache: 'no-store' });

      if (!response.ok) {
        return [];
      }

      const payload = await response.json();
      const rawSources = Array.isArray(payload?.sources) ? payload.sources : [];

      return uniqueStrings(rawSources.map((source) => (
        typeof source === 'string' ? source : source?.url
      )));
    } catch (error) {
      console.warn('No se pudo leer el manifest de packs.', error);
      return [];
    }
  }

  async loadSources(sourceUrls = []) {
    const uniqueUrls = uniqueStrings(sourceUrls);
    const sourceResults = await Promise.all(uniqueUrls.map(async (sourceUrl) => {
      try {
        const normalizedSource = await this.loadSource(sourceUrl);
        return {
          source: normalizedSource.source,
          categories: normalizedSource.categories,
          error: null,
        };
      } catch (error) {
        return {
          source: null,
          categories: [],
          error: {
            sourceUrl,
            message: error.message || 'No se pudo cargar el pack.',
          },
        };
      }
    }));

    return {
      categories: sourceResults.flatMap((result) => result.categories),
      sources: sourceResults
        .map((result) => result.source)
        .filter(Boolean),
      errors: sourceResults
        .map((result) => result.error)
        .filter(Boolean),
    };
  }

  async loadSource(sourceUrl) {
    if (!this.fetchImpl) {
      throw new Error('fetch no está disponible en este entorno.');
    }

    const response = await this.fetchImpl(sourceUrl, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al cargar ${sourceUrl}`);
    }

    const payload = await response.json();
    return this.normalizeSourcePayload(payload, sourceUrl);
  }

  normalizeSourcePayload(payload, sourceUrl) {
    const rawPacks = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.packs)
        ? payload.packs
        : [payload];

    const sourceId = slugify(payload?.source?.id || sourceUrl) || 'external-pack';
    const sourceLabel = String(
      payload?.source?.label
      || payload?.label
      || this.getSourceLabelFromUrl(sourceUrl),
    );

    const categories = rawPacks
      .map((pack, index) => this.normalizePack(pack, {
        sourceId,
        sourceLabel,
        sourceUrl,
      }, index))
      .filter((pack) => pack.words.length > 0);

    return {
      source: {
        id: sourceId,
        label: sourceLabel,
        sourceUrl,
        isBuiltIn: false,
      },
      categories,
    };
  }

  normalizePack(rawPack, sourceMeta, index) {
    const packLabel = String(rawPack?.label || rawPack?.name || `Pack ${index + 1}`);
    const packId = slugify(rawPack?.id || packLabel) || `pack-${index + 1}`;
    const words = [...new Set(
      (Array.isArray(rawPack?.words) ? rawPack.words : [])
        .map((word) => normalizeWord(word))
        .filter(Boolean),
    )];

    return {
      id: `${sourceMeta.sourceId}:${packId}`,
      baseId: packId,
      label: packLabel,
      description: String(rawPack?.description || `Pack externo cargado desde ${sourceMeta.sourceLabel}`),
      words,
      sourceId: sourceMeta.sourceId,
      sourceLabel: sourceMeta.sourceLabel,
      sourceUrl: sourceMeta.sourceUrl,
      isBuiltIn: false,
      isExternal: true,
    };
  }

  getSourceLabelFromUrl(sourceUrl) {
    const filename = String(sourceUrl).split('/').pop() || sourceUrl;
    return filename.replace(/\.json$/i, '').replace(/[-_]+/g, ' ');
  }
}
