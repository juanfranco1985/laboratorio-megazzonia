export class NativeBridge {
  constructor(hostWindow = window) {
    this.hostWindow = hostWindow;
    this.nativeBridge = hostWindow.AndroidBridge || null;
  }

  trackEvent(name, payload = {}) {
    try {
      if (this.nativeBridge?.trackEvent) {
        this.nativeBridge.trackEvent(name, JSON.stringify(payload));
      }
    } catch (error) {
      console.warn('No se pudo enviar el evento nativo.', error);
    }
  }

  hasRewardedPlacement() {
    return Boolean(
      this.nativeBridge?.requestRewardedPlacement
      || this.nativeBridge?.requestReward
      || this.nativeBridge?.requestPlacement
      || this.nativeBridge?.showPlacement
    );
  }

  requestPlacement(placement, payload = {}) {
    try {
      if (this.nativeBridge?.requestPlacement) {
        this.nativeBridge.requestPlacement(placement, JSON.stringify(payload));
        return true;
      }

      if (this.nativeBridge?.showPlacement) {
        this.nativeBridge.showPlacement(placement, JSON.stringify(payload));
        return true;
      }
    } catch (error) {
      console.warn('No se pudo solicitar la placement nativa.', error);
    }

    return false;
  }

  async requestReward(placement, payload = {}) {
    try {
      if (this.nativeBridge?.requestRewardedPlacement) {
        const result = await Promise.resolve(
          this.nativeBridge.requestRewardedPlacement(placement, JSON.stringify(payload)),
        );
        return this.normalizeRewardResult(result);
      }

      if (this.nativeBridge?.requestReward) {
        const result = await Promise.resolve(
          this.nativeBridge.requestReward(placement, JSON.stringify(payload)),
        );
        return this.normalizeRewardResult(result);
      }
    } catch (error) {
      console.warn('No se pudo solicitar la recompensa nativa.', error);
      return {
        granted: false,
        raw: null,
      };
    }

    return {
      granted: false,
      raw: null,
    };
  }

  normalizeRewardResult(rawResult) {
    if (typeof rawResult === 'boolean') {
      return {
        granted: rawResult,
        raw: rawResult,
      };
    }

    if (typeof rawResult === 'string') {
      const normalized = rawResult.trim().toLowerCase();
      return {
        granted: ['rewarded', 'granted', 'ok', 'true', '1'].includes(normalized),
        raw: rawResult,
      };
    }

    if (rawResult && typeof rawResult === 'object') {
      return {
        granted: Boolean(rawResult.granted ?? rawResult.rewarded ?? rawResult.ok),
        raw: rawResult,
      };
    }

    return {
      granted: false,
      raw: rawResult,
    };
  }

  async share({ title, text, url }) {
    const shareText = [text, url].filter(Boolean).join('\n');

    if (this.nativeBridge?.shareText) {
      this.nativeBridge.shareText(shareText, title || '');
      return { method: 'native' };
    }

    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });
      return { method: 'webshare' };
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText([title, shareText].filter(Boolean).join('\n'));
      return { method: 'clipboard' };
    }

    return {
      method: 'unavailable',
      text: [title, shareText].filter(Boolean).join('\n'),
    };
  }
}
