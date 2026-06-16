import { formatNumber } from "../utils.mjs";

export class UISystem {
  constructor() {
    this.collectionCache = new WeakMap();
    this.dom = {
      energyValue: document.getElementById("energyValue"),
      epsValue: document.getElementById("epsValue"),
      droneValue: document.getElementById("droneValue"),
      coreValue: document.getElementById("coreValue"),
      prestigeMultiplierLabel: document.getElementById("prestigeMultiplierLabel"),
      manualClickBtn: document.getElementById("manualClickBtn"),
      prestigeBtn: document.getElementById("prestigeBtn"),
      prestigeHint: document.getElementById("prestigeHint"),
      boostHint: document.getElementById("boostHint"),
      statusText: document.getElementById("statusText"),
      machineList: document.getElementById("machineList"),
      upgradeList: document.getElementById("upgradeList"),
      missionList: document.getElementById("missionList"),
      contractList: document.getElementById("contractList"),
      dailyStreakLabel: document.getElementById("dailyStreakLabel"),
      milestoneText: document.getElementById("milestoneText"),
      adBoostBtn: document.getElementById("adBoostBtn"),
      adBonusBtn: document.getElementById("adBonusBtn"),
      drawEventBtn: document.getElementById("drawEventBtn"),
      bonusTray: document.getElementById("bonusTray"),
      panelToggleBtn: document.getElementById("panelToggleBtn"),
      ultraModeBtn: document.getElementById("ultraModeBtn"),
      controlPanel: document.getElementById("controlPanel"),
      eventStatus: document.getElementById("eventStatus"),
      inventorySummary: document.getElementById("inventorySummary"),
      buyModeButtons: document.querySelectorAll("#buyModeGroup .mode-btn"),
      itemTemplate: document.getElementById("itemTemplate"),
      multPrestige: document.getElementById("multPrestige"),
      multMilestones: document.getElementById("multMilestones"),
      multUpgrades: document.getElementById("multUpgrades"),
      multMomentum: document.getElementById("multMomentum"),
      multProgression: document.getElementById("multProgression"),
      multRewarded: document.getElementById("multRewarded"),
      multTotal: document.getElementById("multTotal"),
      adBoostTimer: document.getElementById("adBoostTimer"),
      nextUnlockLabel: document.getElementById("nextUnlockLabel"),
      nextUnlockPercent: document.getElementById("nextUnlockPercent"),
      nextUnlockProgress: document.getElementById("nextUnlockProgress"),
      openGuideBtn: document.getElementById("openGuideBtn"),
      onboardingModal: document.getElementById("onboardingModal"),
      onboardingCloseBtn: document.getElementById("onboardingCloseBtn"),
      onboardingDoneBtn: document.getElementById("onboardingDoneBtn"),
      onboardingProgressTitle: document.getElementById("onboardingProgressTitle"),
      onboardingSteps: document.getElementById("onboardingSteps"),
      shortcutHint: document.getElementById("shortcutHint"),
      telemetrySummary: document.getElementById("telemetrySummary"),
      telemetryExportBtn: document.getElementById("telemetryExportBtn"),
      factoryCanvas: document.getElementById("factoryCanvas"),
      factoryFlowSummary: document.getElementById("factoryFlowSummary"),
      factoryOpsSummary: document.getElementById("factoryOpsSummary")
    };
  }

  getCollectionNode(container, key) {
    const cache = this.collectionCache.get(container);
    if (!cache) return null;
    return cache.get(String(key)) || null;
  }

  flashElement(element, className = "flash-success", durationMs = 460) {
    if (!element || !element.classList) return;
    element.classList.remove(className);
    // Force style recalc so repeated flashes are visible.
    void element.offsetWidth;
    element.classList.add(className);
    setTimeout(() => {
      if (element && element.classList) element.classList.remove(className);
    }, durationMs);
  }

  flashCollectionItem(container, key, className = "flash-success", durationMs = 460) {
    const node = this.getCollectionNode(container, key);
    if (!node) return;
    this.flashElement(node, className, durationMs);
  }

  applyListItemState(node, {
    title,
    description,
    buttonText,
    buttonDisabled,
    onClick,
    secondaryButtonText = "",
    secondaryButtonDisabled = true,
    onSecondaryClick = null
  }) {
    node.querySelector(".item-name").textContent = title;
    node.querySelector(".item-desc").textContent = description;
    const button = node.querySelector(".buy-btn");
    button.textContent = buttonText;
    button.disabled = buttonDisabled;
    button.onclick = onClick;

    const secondary = node.querySelector(".aux-btn");
    if (secondary) {
      if (onSecondaryClick) {
        secondary.classList.remove("hidden");
        secondary.textContent = secondaryButtonText;
        secondary.disabled = secondaryButtonDisabled;
        secondary.onclick = onSecondaryClick;
      } else {
        secondary.classList.add("hidden");
        secondary.textContent = "";
        secondary.disabled = true;
        secondary.onclick = null;
      }
    }
  }

  buildListItem(config) {
    const node = this.dom.itemTemplate.content.firstElementChild.cloneNode(true);
    this.applyListItemState(node, config);
    return node;
  }

  updateBuyModeUI(mode) {
    this.dom.buyModeButtons.forEach((button) => {
      const buttonMode = button.getAttribute("data-buy-mode");
      button.classList.toggle("active", buttonMode === mode);
    });
  }

  renderResourceValues(state, eps) {
    this.dom.energyValue.textContent = formatNumber(state.energy);
    this.dom.epsValue.textContent = formatNumber(eps);
    this.dom.droneValue.textContent = formatNumber(state.drones);
    this.dom.coreValue.textContent = formatNumber(state.prestigeCores);
  }

  renderCollection(container, entries) {
    let cache = this.collectionCache.get(container);
    if (!cache) {
      cache = new Map();
      this.collectionCache.set(container, cache);
    }

    const useFragment = Boolean(document.createDocumentFragment) && Boolean(container.replaceChildren);
    const fragment = useFragment ? document.createDocumentFragment() : null;
    const aliveKeys = new Set();

    entries.forEach((entry, index) => {
      const key = String(entry.key ?? index);
      let node = cache.get(key);
      if (!node) {
        node = this.buildListItem(entry.config);
        cache.set(key, node);
      } else {
        this.applyListItemState(node, entry.config);
      }
      aliveKeys.add(key);
      if (fragment) fragment.appendChild(node);
    });

    [...cache.keys()].forEach((key) => {
      if (!aliveKeys.has(key)) cache.delete(key);
    });

    if (fragment) {
      container.replaceChildren(fragment);
      return;
    }

    container.innerHTML = "";
    entries.forEach((entry, index) => {
      const key = String(entry.key ?? index);
      const node = cache.get(key);
      if (node) container.appendChild(node);
    });
  }

  renderSkeletonList(container, count = 4) {
    const safeCount = Math.max(1, Math.floor(count));
    let html = "";
    for (let i = 0; i < safeCount; i += 1) {
      html += "<div class=\"skeleton-item\"><div class=\"skeleton-line\"></div><div class=\"skeleton-line short\"></div><div class=\"skeleton-button\"></div></div>";
    }
    container.innerHTML = html;
  }

  setModalVisible(visible) {
    if (!this.dom.onboardingModal) return;
    this.dom.onboardingModal.classList.toggle("hidden", !visible);
    this.dom.onboardingModal.setAttribute("aria-hidden", visible ? "false" : "true");
  }
}
