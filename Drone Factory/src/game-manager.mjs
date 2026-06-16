import {
  AD_BOOST_COOLDOWN_MS,
  AD_BOOST_DURATION_MS,
  AD_BONUS_COOLDOWN_MS,
  BUY_MODES,
  DRONE_RECIPE_DEFS,
  FACTORY_STATION_DEFS,
  META_CHECK_MS,
  MILESTONE_DEFS,
  ONBOARDING_REFRESH_MS,
  OFFLINE_CAP_SECONDS,
  ONBOARDING_STEPS,
  SAVE_INTERVAL_MS,
  SECONDARY_UI_REFRESH_MS,
  STORAGE_KEY,
  TELEMETRY_REFRESH_MS,
  UI_REFRESH_MS
} from "./constants.mjs";
import { clamp, formatDuration, formatNumber, getLocalISODate, isPreviousDay, safePercentage } from "./utils.mjs";
import {
  createDailyMissions,
  createDailyProgress,
  getMissionProgress,
  isMissionComplete
} from "./systems/mission-system.mjs";
import { SaveSystem } from "./systems/save-system.mjs";
import { ResourceSystem } from "./systems/resource-system.mjs";
import { EconomySystem } from "./systems/economy-system.mjs";
import { PrestigeSystem } from "./systems/prestige-system.mjs";
import { TelemetrySystem } from "./systems/telemetry-system.mjs";
import { computeOfflineGain } from "./systems/offline-system.mjs";
import { CardFactorySystem } from "./systems/card-factory-system.mjs";
import { UISystem } from "./ui/ui-system.mjs";

export class GameManager {
  constructor() {
    this.saveSystem = new SaveSystem(STORAGE_KEY);
    this.state = this.saveSystem.load();
    this.resourceSystem = new ResourceSystem(this.state);
    this.economySystem = new EconomySystem(this.state);
    this.cardFactorySystem = new CardFactorySystem(this.state);
    this.prestigeSystem = new PrestigeSystem(this.state);
    this.telemetry = new TelemetrySystem();
    this.ui = new UISystem();

    this.lastFrameTime = performance.now();
    this.lastUIRefresh = 0;
    this.lastMetaCheck = 0;
    this.lastSecondaryUIRefresh = 0;
    this.lastTelemetryRefresh = 0;
    this.lastOnboardingRefresh = 0;
    this.lastComputedEPS = 0;
    this.lastComputedFactoryEPS = 0;
    this.statusText = "";
    this.statusExpiresAt = 0;
    this.catalogDirty = true;
    this.lastCatalogRefresh = 0;
    this.catalogLoadingUntil = Date.now() + 340;
    this.guideVisible = false;
    this.controlPanelOpen = false;
    this.panelManualOverride = false;
    this.ultraCleanEnabled = true;
    this.lastGameplayActionAt = Date.now();

    this.telemetry.startSession();
  }

  init() {
    this.bindEvents();
    this.ensureDailyCycle(false);
    this.telemetry.trackMissionSetIssued(this.state.dailyDate);
    this.applyOfflineProgress();
    this.applyDailyReturnBonus();
    this.checkMilestones();
    this.ui.updateBuyModeUI(this.state.buyMode);
    const params = new URLSearchParams(window.location.search);
    this.guideVisible = !this.state.onboardingCompleted && params.get("guide") === "1";
    this.ui.setModalVisible(this.guideVisible);
    if (!this.state.onboardingCompleted && !this.guideVisible) {
      this.setStatus("Abre Guia o presiona G para ver la ruta recomendada.", 4200);
    }
    this.setUltraClean(this.ultraCleanEnabled);
    this.syncControlPanelUI();
    this.render(true);

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);

    setInterval(() => this.save(true), SAVE_INTERVAL_MS);
    window.addEventListener("beforeunload", () => {
      this.save(true);
      this.telemetry.endSession();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.save(true);
    });
  }

  bindEvents() {
    this.ui.dom.manualClickBtn.addEventListener("click", () => {
      const clickValue = this.economySystem.getManualClickValue(this.getGlobalMultiplier());
      this.resourceSystem.manualClick(clickValue);
      this.telemetry.trackManualClick();
      this.markGameplayAction();
      this.catalogDirty = true;
      this.setStatus(`Click: +${formatNumber(clickValue)} energia`, 1400);
      this.render(true);
    });

    this.ui.dom.prestigeBtn.addEventListener("click", () => {
      const gain = this.prestigeSystem.getPotentialGain();
      if (gain <= 0) return;
      const bonus = 1 + (this.state.prestigeCores + gain) * 0.12;
      const ok = window.confirm(`Reiniciaras progreso y obtendras +${gain} Nucleo(s).\nNuevo multiplicador de prestigio: x${bonus.toFixed(2)}`);
      if (!ok) return;
      const earned = this.prestigeSystem.doPrestige();
      this.telemetry.trackPrestige(this.state.prestigeCores);
      this.ensureDailyCycle(false);
      this.markGameplayAction();
      this.queueCatalogSkeleton(260);
      this.ui.flashElement(this.ui.dom.coreValue, "flash-success");
      this.setStatus(`Prestigio aplicado: +${earned} Nucleo(s)`, 3200);
      this.render(true);
      this.save(true);
    });

    this.ui.dom.adBoostBtn.addEventListener("click", () => this.activateAdBoost());
    this.ui.dom.adBonusBtn.addEventListener("click", () => this.activateAdBonus());
    this.ui.dom.drawEventBtn.addEventListener("click", () => {
      const result = this.cardFactorySystem.drawEventCard(Date.now());
      if (!result.ok) {
        const wait = formatDuration(result.waitMs / 1000);
        this.setStatus(`Evento en cooldown: ${wait}.`, 2100);
        return;
      }
      this.telemetry.trackEventDraw(result.event.id);
      this.markGameplayAction();
      this.catalogDirty = true;
      this.ui.flashElement(this.ui.dom.eventStatus, "flash-event");
      this.setStatus(`Evento activo: ${result.event.name}.`, 2500);
      this.render(true);
    });

    this.ui.dom.buyModeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.getAttribute("data-buy-mode");
        this.setBuyMode(mode);
      });
    });

    this.ui.dom.panelToggleBtn.addEventListener("click", () => {
      this.controlPanelOpen = !this.controlPanelOpen;
      this.panelManualOverride = this.controlPanelOpen;
      this.syncControlPanelUI();
    });

    this.ui.dom.ultraModeBtn.addEventListener("click", () => {
      this.setUltraClean(!this.ultraCleanEnabled);
      this.render(true);
    });

    this.ui.dom.openGuideBtn.addEventListener("click", () => {
      this.guideVisible = true;
      this.ui.setModalVisible(true);
      this.renderOnboardingProgress();
    });

    this.ui.dom.onboardingCloseBtn.addEventListener("click", () => {
      this.guideVisible = false;
      this.ui.setModalVisible(false);
    });
    this.ui.dom.onboardingDoneBtn.addEventListener("click", () => {
      this.state.onboardingCompleted = true;
      this.guideVisible = false;
      this.ui.setModalVisible(false);
      this.save(true);
      this.setStatus("Tutorial completado. Ya tienes acceso total.", 2600);
    });

    this.ui.dom.telemetryExportBtn.addEventListener("click", async () => {
      const payload = this.telemetry.exportPrettyJson();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(payload);
          this.setStatus("Telemetria copiada al portapapeles.", 2200);
          return;
        } catch (_error) {
          // Fallback below.
        }
      }
      window.prompt("Copia la telemetria:", payload);
      this.setStatus("Telemetria preparada para copia manual.", 2400);
    });

    window.addEventListener("keydown", (event) => {
      const tag = event.target && event.target.tagName ? event.target.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (event.code === "Space") {
        event.preventDefault();
        this.ui.dom.manualClickBtn.click();
      }
      if (event.code === "Digit1") this.setBuyMode("1");
      if (event.code === "Digit2") this.setBuyMode("10");
      if (event.code === "Digit3") this.setBuyMode("max");
      if (event.code === "KeyG") {
        this.guideVisible = true;
        this.ui.setModalVisible(true);
      }
    });
  }

  setBuyMode(mode) {
    if (!BUY_MODES.includes(mode)) return;
    this.state.buyMode = mode;
    this.markGameplayAction();
    this.queueCatalogSkeleton(170);
    this.ui.updateBuyModeUI(this.state.buyMode);
    this.render(true);
  }

  setStatus(message, ttlMs = 2800) {
    this.statusText = message;
    this.statusExpiresAt = Date.now() + ttlMs;
  }

  setUltraClean(enabled) {
    this.ultraCleanEnabled = Boolean(enabled);
    if (document.body && document.body.classList) {
      document.body.classList.toggle("ultra-clean", this.ultraCleanEnabled);
    }
    if (this.ui.dom.ultraModeBtn) {
      this.ui.dom.ultraModeBtn.textContent = this.ultraCleanEnabled ? "Ultra limpio: ON" : "Ultra limpio: OFF";
    }
    if (this.ultraCleanEnabled) {
      this.panelManualOverride = false;
      this.lastGameplayActionAt = Date.now();
      this.controlPanelOpen = false;
    }
    this.syncControlPanelUI();
  }

  markGameplayAction() {
    this.lastGameplayActionAt = Date.now();
    if (this.ultraCleanEnabled && !this.panelManualOverride && this.controlPanelOpen) {
      this.controlPanelOpen = false;
      this.syncControlPanelUI();
    }
  }

  updateAutoClean(now = Date.now()) {
    if (!this.ultraCleanEnabled || this.panelManualOverride) return;
    const shouldOpen = (now - this.lastGameplayActionAt) > 4200;
    if (shouldOpen !== this.controlPanelOpen) {
      this.controlPanelOpen = shouldOpen;
      this.syncControlPanelUI();
    }
  }

  syncControlPanelUI() {
    const panel = this.ui.dom.controlPanel;
    const toggle = this.ui.dom.panelToggleBtn;
    if (!panel || !toggle) return;
    panel.classList.toggle("collapsed", !this.controlPanelOpen);
    panel.setAttribute("aria-hidden", this.controlPanelOpen ? "false" : "true");
    toggle.textContent = this.controlPanelOpen ? "Ocultar panel" : "Mostrar panel";
  }

  updateBonusTrayVisibility(now = Date.now()) {
    const boostVisible = now < this.state.adBoostExpiresAt || now >= this.state.adBoostCooldownUntil;
    const bonusVisible = now >= this.state.adBonusCooldownUntil;
    const eventActive = Boolean(this.state.factory.event.activeEvent) && now < this.state.factory.event.activeEvent.expiresAt;
    const eventVisible = eventActive || now >= this.state.factory.event.eventCooldownUntil;

    this.ui.dom.adBoostBtn.classList.toggle("hidden", !boostVisible);
    this.ui.dom.adBonusBtn.classList.toggle("hidden", !bonusVisible);
    this.ui.dom.drawEventBtn.classList.toggle("hidden", !eventVisible);

    const trayVisible = boostVisible || bonusVisible || eventVisible;
    this.ui.dom.bonusTray.classList.toggle("hidden", !trayVisible);
  }

  queueCatalogSkeleton(durationMs = 220) {
    this.catalogDirty = true;
    this.catalogLoadingUntil = Math.max(this.catalogLoadingUntil, Date.now() + Math.max(60, durationMs));
  }

  renderCatalogSkeletons() {
    this.ui.renderSkeletonList(this.ui.dom.machineList, 4);
    this.ui.renderSkeletonList(this.ui.dom.upgradeList, 3);
    this.ui.renderSkeletonList(this.ui.dom.missionList, 3);
    this.ui.renderSkeletonList(this.ui.dom.contractList, 2);
  }

  getMilestoneMultiplier() {
    return MILESTONE_DEFS.reduce((mult, def) => {
      return this.state.claimedMilestones[def.id] ? mult * def.bonusMultiplier : mult;
    }, 1);
  }

  getAdBoostMultiplier(now = Date.now()) {
    return now < this.state.adBoostExpiresAt ? 2 : 1;
  }

  getGlobalMultiplier(now = Date.now()) {
    return this.prestigeSystem.getMultiplier() * this.getMilestoneMultiplier() * this.getAdBoostMultiplier(now);
  }

  claimMission(missionId) {
    const mission = this.state.dailyMissions.find((item) => item.id === missionId);
    if (!mission || mission.claimed || !isMissionComplete(this.state.dailyProgress, mission)) return;
    mission.claimed = true;
    this.markGameplayAction();
    this.resourceSystem.addEnergy(mission.reward, "dailyMission");
    this.telemetry.trackMissionClaim(missionId);
    this.catalogDirty = true;
    this.ui.flashCollectionItem(this.ui.dom.missionList, missionId, "flash-claim", 560);
    this.setStatus(`Mision cobrada: +${formatNumber(mission.reward)} energia`, 2600);
    if (this.state.dailyMissions.every((item) => item.claimed)) {
      this.onAllMissionsClaimed();
    }
  }

  onAllMissionsClaimed() {
    const today = this.state.dailyDate;
    if (this.state.dailyLastCompletedDate === today) return;

    if (this.state.dailyLastCompletedDate && isPreviousDay(this.state.dailyLastCompletedDate, today)) this.state.dailyStreak += 1;
    else this.state.dailyStreak = 1;

    this.state.dailyLastCompletedDate = today;
    this.telemetry.trackMissionSetCompleted(today);

    const chestEnergy = Math.max(400, this.lastComputedEPS * (120 + this.state.dailyStreak * 10));
    this.resourceSystem.addEnergy(chestEnergy, "dailyChest");

    let coreGain = 0;
    if (this.state.dailyStreak % 3 === 0) {
      coreGain = 1;
      this.state.prestigeCores += coreGain;
    }

    this.catalogDirty = true;
    this.ui.flashElement(this.ui.dom.dailyStreakLabel, "flash-claim", 560);
    this.setStatus(`Dia completado: +${formatNumber(chestEnergy)} energia${coreGain > 0 ? ` y +${coreGain} Nucleo` : ""}`, 4200);
  }

  ensureDailyCycle(showStatus = false) {
    const today = getLocalISODate();
    if (!this.state.dailyDate) {
      this.state.dailyDate = today;
      this.state.dailyMissions = createDailyMissions(today, this.state.lifetimeEnergy, this.state.dailyStreak);
      this.state.dailyProgress = createDailyProgress();
      this.cardFactorySystem.resetDailyProduction(today, this.state.lifetimeEnergy);
      this.telemetry.trackMissionSetIssued(today);
      this.queueCatalogSkeleton(220);
      return true;
    }

    if (this.state.dailyDate === today) {
      if (!Array.isArray(this.state.factory.contracts) || this.state.factory.contracts.length <= 0) {
        this.cardFactorySystem.resetDailyProduction(today, this.state.lifetimeEnergy);
        this.queueCatalogSkeleton(220);
      }
      return false;
    }

    const previousDate = this.state.dailyDate;
    if (!isPreviousDay(previousDate, today)) this.state.dailyStreak = 0;
    else if (this.state.dailyLastCompletedDate !== previousDate) this.state.dailyStreak = 0;

    this.state.dailyDate = today;
    this.state.dailyMissions = createDailyMissions(today, this.state.lifetimeEnergy, this.state.dailyStreak);
    this.state.dailyProgress = createDailyProgress();
    this.cardFactorySystem.resetDailyProduction(today, this.state.lifetimeEnergy);
    this.telemetry.trackMissionSetIssued(today);
    this.queueCatalogSkeleton(220);

    if (showStatus) this.setStatus("Nuevas misiones diarias disponibles.", 4200);
    return true;
  }

  checkMilestones() {
    const unlocked = [];
    let coreGain = 0;

    MILESTONE_DEFS.forEach((def) => {
      if (this.state.claimedMilestones[def.id]) return;
      if (this.state.lifetimeEnergy >= def.threshold) {
        this.state.claimedMilestones[def.id] = true;
        unlocked.push(def);
        coreGain += def.coreReward;
      }
    });

    if (unlocked.length <= 0) return;
    if (coreGain > 0) this.state.prestigeCores += coreGain;
    this.catalogDirty = true;
    this.ui.flashElement(this.ui.dom.milestoneText, "flash-success");
    const labels = unlocked.map((item) => item.label).join(", ");
    this.setStatus(`Hito desbloqueado: ${labels}${coreGain > 0 ? ` (+${coreGain} Nucleo)` : ""}`, 5600);
  }

  activateAdBoost() {
    const now = Date.now();
    if (now < this.state.adBoostExpiresAt) {
      const remaining = (this.state.adBoostExpiresAt - now) / 1000;
      this.setStatus(`Boost activo (${formatDuration(remaining)} restantes).`, 2200);
      return;
    }
    if (now < this.state.adBoostCooldownUntil) {
      const wait = (this.state.adBoostCooldownUntil - now) / 1000;
      this.setStatus(`Rewarded en cooldown: espera ${formatDuration(wait)}.`, 2400);
      return;
    }

    this.state.adBoostExpiresAt = now + AD_BOOST_DURATION_MS;
    this.state.adBoostCooldownUntil = now + AD_BOOST_COOLDOWN_MS;
    this.markGameplayAction();
    this.catalogDirty = true;
    this.ui.flashElement(this.ui.dom.boostHint, "flash-event");
    this.setStatus("Rewarded activado: x2 produccion por 2 minutos.", 3200);
    this.render(true);
  }

  activateAdBonus() {
    const now = Date.now();
    if (now < this.state.adBonusCooldownUntil) {
      const wait = (this.state.adBonusCooldownUntil - now) / 1000;
      this.setStatus(`Bonus en cooldown: espera ${formatDuration(wait)}.`, 2200);
      return;
    }
    const reward = Math.max(220, this.lastComputedEPS * 180);
    this.resourceSystem.addEnergy(reward, "rewardedBonus");
    this.state.adBonusCooldownUntil = now + AD_BONUS_COOLDOWN_MS;
    this.markGameplayAction();
    this.catalogDirty = true;
    this.ui.flashElement(this.ui.dom.energyValue, "flash-success");
    this.setStatus(`Bonus instantaneo: +${formatNumber(reward)} energia.`, 2600);
    this.render(true);
  }

  applyOfflineProgress() {
    const now = Date.now();
    const awaySeconds = Math.max(0, (now - Number(this.state.lastSeen || now)) / 1000);
    if (awaySeconds < 8) {
      this.state.lastSeen = now;
      return;
    }

    const globalMult = this.getGlobalMultiplier(now);
    const offlineEPS = this.economySystem.computeEPS(globalMult) + this.cardFactorySystem.getFleetEPS(now) * globalMult;
    const { appliedSeconds, gain: offlineGain } = computeOfflineGain(offlineEPS, awaySeconds, OFFLINE_CAP_SECONDS, 0.8);
    if (offlineGain > 0) {
      this.resourceSystem.addEnergy(offlineGain, "offline");
      this.setStatus(`Produccion offline: +${formatNumber(offlineGain)} (${formatDuration(appliedSeconds)})`, 5200);
      this.catalogDirty = true;
    }
    this.state.lastSeen = now;
  }

  applyDailyReturnBonus() {
    const today = getLocalISODate();
    if (!this.state.lastDailyBonusDate) {
      this.state.lastDailyBonusDate = today;
      return;
    }
    if (this.state.lastDailyBonusDate === today) return;
    const globalMult = this.getGlobalMultiplier();
    const epsNow = this.economySystem.computeEPS(globalMult) + this.cardFactorySystem.getFleetEPS() * globalMult;
    const bonus = Math.max(150, epsNow * 300);
    this.resourceSystem.addEnergy(bonus, "dailyReturn");
    this.state.lastDailyBonusDate = today;
    this.catalogDirty = true;
    this.setStatus(`Bonus de retorno: +${formatNumber(bonus)} energia`, 4500);
  }

  save(updateLastSeen = true) {
    if (updateLastSeen) this.state.lastSeen = Date.now();
    this.saveSystem.save(this.state);
  }

  isStationUnlocked(def) {
    return this.cardFactorySystem.isStationUnlocked(def);
  }

  isRecipeUnlocked(def) {
    return this.cardFactorySystem.isRecipeUnlocked(def);
  }

  renderMachineList() {
    const now = Date.now();
    const focusRecipeId = this.cardFactorySystem.getRecommendedRecipeId();
    const deficits = this.cardFactorySystem.getRecipeDeficit(focusRecipeId) || {};
    const entries = FACTORY_STATION_DEFS.map((def) => {
      if (!this.isStationUnlocked(def)) return null;
      const level = this.cardFactorySystem.getStationLevel(def.id);
      const craftCost = this.cardFactorySystem.getStationCraftCost(def, now);
      const upgradeCost = this.cardFactorySystem.getStationUpgradeCost(def);
      const output = this.cardFactorySystem.getStationOutputAmount(def);
      const check = this.cardFactorySystem.canCraft(def, now);
      const canCraft = check.ok;
      const deficit = Math.max(0, deficits[def.componentId] || 0);
      const cooldownLabel = check.reason === "cooldown"
        ? `CD ${formatDuration(check.waitMs / 1000)}`
        : "Lista";
      const inventoryCount = this.state.factory.inventory[def.componentId] || 0;

      return {
        key: def.id,
        config: {
          title: `${def.name} Lv.${level}`,
          description: `${def.description} | ${def.componentName}: ${formatNumber(inventoryCount)} | Faltante receta: ${formatNumber(deficit)} | Produccion: +${formatNumber(output)} | Costo: ${formatNumber(craftCost)} | ${cooldownLabel}`,
          buttonText: canCraft ? (deficit > 0 ? `Fabricar ${def.componentName} (faltante)` : `Fabricar ${def.componentName}`) : check.reason === "cooldown" ? "En cooldown" : "Sin energia",
          buttonDisabled: !canCraft,
          onClick: () => {
            const result = this.cardFactorySystem.craftComponent(def.id, this.resourceSystem, Date.now());
            if (!result.ok) return;
            this.markGameplayAction();
            this.telemetry.trackFactoryCraft(def.id, result.amount);
            this.catalogDirty = true;
            this.ui.flashCollectionItem(this.ui.dom.machineList, def.id, "flash-success");
            this.setStatus(`${def.componentName} +${formatNumber(result.amount)} fabricado`, 1700);
            this.render(true);
          },
          secondaryButtonText: `Upgrade (${formatNumber(upgradeCost)})`,
          secondaryButtonDisabled: this.state.energy + 1e-9 < upgradeCost,
          onSecondaryClick: () => {
            const result = this.cardFactorySystem.upgradeStation(def.id, this.resourceSystem);
            if (!result.ok) return;
            this.markGameplayAction();
            this.catalogDirty = true;
            this.ui.flashCollectionItem(this.ui.dom.machineList, def.id, "flash-event");
            this.setStatus(`${def.name} mejorada a Lv.${result.newLevel}`, 1900);
            this.render(true);
          }
        }
      };
    }).filter(Boolean);
    this.ui.renderCollection(this.ui.dom.machineList, entries);
  }

  renderUpgradeList() {
    const now = Date.now();
    const saleMult = this.cardFactorySystem.getEventMultipliers(now).saleMultiplier;
    const globalMult = this.getGlobalMultiplier(now);
    const entries = DRONE_RECIPE_DEFS.map((recipe) => {
      if (!this.isRecipeUnlocked(recipe)) return null;
      const built = this.state.factory.dronesBuilt[recipe.id] || 0;
      const req = Object.entries(recipe.requirements)
        .map(([componentId, qty]) => `${componentId}:${qty}`)
        .join(" ");
      const canAssemble = this.cardFactorySystem.canAssemble(recipe);
      const reward = recipe.saleReward * globalMult * saleMult;
      return {
        key: recipe.id,
        config: {
          title: `${recipe.name} (${formatNumber(built)})`,
          description: `${recipe.description} | Req: ${req} | Venta: +${formatNumber(reward)} energia | Fleet EPS base: ${formatNumber(recipe.baseFleetEps)}`,
          buttonText: canAssemble ? "Ensamblar drone" : "Faltan piezas",
          buttonDisabled: !canAssemble,
          onClick: () => {
            const result = this.cardFactorySystem.assembleDrone(recipe.id, this.resourceSystem, this.getGlobalMultiplier(Date.now()), Date.now());
            if (!result.ok) return;
            this.markGameplayAction();
            this.telemetry.trackDroneAssemble(recipe.id, result.reward);
            this.catalogDirty = true;
            this.ui.flashCollectionItem(this.ui.dom.upgradeList, recipe.id, "flash-success");
            this.ui.flashElement(this.ui.dom.energyValue, "flash-success");
            this.setStatus(`${recipe.name} vendido: +${formatNumber(result.reward)} energia`, 1800);
            this.render(true);
          }
        }
      };
    }).filter(Boolean);
    this.ui.renderCollection(this.ui.dom.upgradeList, entries);
  }

  renderMissionList() {
    const entries = this.state.dailyMissions.map((mission) => {
      const progress = getMissionProgress(this.state.dailyProgress, mission);
      const capped = Math.min(progress, mission.target);
      const claimed = mission.claimed;
      const completed = isMissionComplete(this.state.dailyProgress, mission);
      return {
        key: mission.id,
        config: {
          title: mission.title,
          description: `${mission.description} | Progreso: ${formatNumber(capped)}/${formatNumber(mission.target)} | Recompensa: ${formatNumber(mission.reward)}`,
          buttonText: claimed ? "Cobrada" : completed ? "Cobrar" : "En curso",
          buttonDisabled: claimed || !completed,
          onClick: () => {
            this.claimMission(mission.id);
            this.render(true);
          }
        }
      };
    });
    this.ui.renderCollection(this.ui.dom.missionList, entries);
  }

  renderContractList() {
    const entries = (this.state.factory.contracts || []).map((contract) => {
      const progress = this.cardFactorySystem.getContractProgress(contract);
      const done = progress >= contract.target;
      return {
        key: contract.id,
        config: {
          title: contract.title,
          description: `Entrega ${contract.target} ${contract.recipeId}. Progreso: ${formatNumber(Math.min(progress, contract.target))}/${formatNumber(contract.target)} | Recompensa: ${formatNumber(contract.reward)}`,
          buttonText: contract.claimed ? "Cobrado" : done ? "Cobrar contrato" : "En curso",
          buttonDisabled: contract.claimed || !done,
          onClick: () => {
            const result = this.cardFactorySystem.claimContract(contract.id, this.resourceSystem);
            if (!result.ok) return;
            this.markGameplayAction();
            this.telemetry.trackContractClaim(contract.id, result.reward);
            this.catalogDirty = true;
            this.ui.flashCollectionItem(this.ui.dom.contractList, contract.id, "flash-claim", 560);
            this.setStatus(`Contrato cobrado: +${formatNumber(result.reward)} energia`, 2200);
            this.render(true);
          }
        }
      };
    });
    this.ui.renderCollection(this.ui.dom.contractList, entries);
  }

  renderFactoryOverview(now = Date.now()) {
    const focusRecipeId = this.cardFactorySystem.getRecommendedRecipeId();
    const focusRecipe = DRONE_RECIPE_DEFS.find((recipe) => recipe.id === focusRecipeId) || DRONE_RECIPE_DEFS[0];
    const deficits = this.cardFactorySystem.getRecipeDeficit(focusRecipeId) || {};
    const missingCount = Object.values(deficits).reduce((sum, qty) => sum + Math.max(0, qty), 0);
    const ready = missingCount <= 0;
    const activeEvent = this.cardFactorySystem.getEventMultipliers(now).activeEvent;
    const contractsOpen = (this.state.factory.contracts || []).filter((contract) => !contract.claimed).length;
    const rows = [
      ["Objetivo", focusRecipe ? focusRecipe.name : focusRecipeId],
      ["Estado de receta", ready ? "Lista para ensamblar" : `${formatNumber(missingCount)} pieza(s) faltantes`],
      ["EPS total", formatNumber(this.lastComputedEPS)],
      ["EPS flota", formatNumber(this.lastComputedFactoryEPS)],
      ["Contratos abiertos", formatNumber(contractsOpen)],
      ["Evento", activeEvent ? activeEvent.name : "Sin evento"]
    ];

    if (this.ui.dom.factoryFlowSummary) {
      this.ui.dom.factoryFlowSummary.textContent = ready
        ? `${focusRecipe.name} listo para venta. Prioriza ensamblaje.`
        : `Produccion enfocada en ${focusRecipe.name}: faltan ${formatNumber(missingCount)} pieza(s).`;
    }

    if (this.ui.dom.factoryOpsSummary) {
      const fragment = document.createDocumentFragment();
      rows.forEach(([label, value]) => {
        const row = document.createElement("div");
        row.className = "ops-row";
        const labelNode = document.createElement("span");
        labelNode.textContent = label;
        const valueNode = document.createElement("strong");
        valueNode.textContent = value;
        row.append(labelNode, valueNode);
        fragment.appendChild(row);
      });
      this.ui.dom.factoryOpsSummary.replaceChildren(fragment);
    }

    this.drawFactoryCanvas(now, focusRecipe, deficits);
  }

  drawFactoryCanvas(now, focusRecipe, deficits) {
    const canvas = this.ui.dom.factoryCanvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "rgba(10, 24, 17, 0.96)");
    bg.addColorStop(1, "rgba(33, 22, 13, 0.88)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(97, 211, 148, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 24; x < width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 20; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const unlockedStations = FACTORY_STATION_DEFS.filter((station) => this.isStationUnlocked(station));
    const stations = unlockedStations.length ? unlockedStations : FACTORY_STATION_DEFS.slice(0, 2);
    const margin = 24;
    const assemblyWidth = Math.min(150, width * 0.22);
    const laneWidth = Math.max(1, width - margin * 2 - assemblyWidth - 18);
    const step = laneWidth / Math.max(1, stations.length);
    const stationY = height * 0.48;

    ctx.strokeStyle = "rgba(176, 132, 95, 0.54)";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(margin, stationY + 34);
    ctx.lineTo(margin + laneWidth + 18, stationY + 34);
    ctx.stroke();

    stations.forEach((station, index) => {
      const x = margin + step * index + step * 0.5;
      const level = this.cardFactorySystem.getStationLevel(station.id);
      const inventory = this.state.factory.inventory[station.componentId] || 0;
      const deficit = Math.max(0, deficits[station.componentId] || 0);
      const cooldownUntil = Math.max(0, this.state.factory.stationCooldowns[station.id] || 0);
      const cooldownMs = this.cardFactorySystem.getStationCooldownMs(station, now);
      const progress = cooldownUntil > now ? clamp(1 - ((cooldownUntil - now) / cooldownMs), 0, 1) : 1;
      const nodeWidth = Math.min(122, Math.max(88, step * 0.74));
      const nodeHeight = 68;
      const y = stationY - nodeHeight * 0.5;

      ctx.fillStyle = deficit > 0 ? "rgba(97, 211, 148, 0.18)" : "rgba(176, 132, 95, 0.17)";
      ctx.strokeStyle = deficit > 0 ? "rgba(97, 211, 148, 0.72)" : "rgba(176, 132, 95, 0.56)";
      ctx.lineWidth = 1.5;
      this.roundCanvasRect(ctx, x - nodeWidth / 2, y, nodeWidth, nodeHeight, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(5, 13, 10, 0.56)";
      this.roundCanvasRect(ctx, x - nodeWidth / 2 + 8, y + nodeHeight - 14, (nodeWidth - 16) * progress, 6, 4);
      ctx.fillStyle = deficit > 0 ? "#61d394" : "#d98a5f";
      ctx.fill();

      ctx.fillStyle = "#ecf7ef";
      ctx.font = "800 11px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(this.shortCanvasLabel(station.name, 14), x, y + 20);
      ctx.fillStyle = "#9eb3a6";
      ctx.font = "700 10px Segoe UI, sans-serif";
      ctx.fillText(`Lv ${level} | ${station.componentName}:${formatNumber(inventory)}`, x, y + 38);
      ctx.fillText(deficit > 0 ? `Faltan ${formatNumber(deficit)}` : "Stock OK", x, y + 53);
    });

    const assemblyX = width - margin - assemblyWidth;
    const assemblyY = stationY - 58;
    const ready = Object.values(deficits).every((qty) => qty <= 0);
    ctx.fillStyle = ready ? "rgba(97, 211, 148, 0.2)" : "rgba(217, 138, 95, 0.16)";
    ctx.strokeStyle = ready ? "rgba(97, 211, 148, 0.78)" : "rgba(217, 138, 95, 0.6)";
    ctx.lineWidth = 1.6;
    this.roundCanvasRect(ctx, assemblyX, assemblyY, assemblyWidth, 116, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ecf7ef";
    ctx.font = "900 12px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Assembly", assemblyX + assemblyWidth / 2, assemblyY + 24);
    ctx.fillStyle = "#9eb3a6";
    ctx.font = "700 10px Segoe UI, sans-serif";
    ctx.fillText(this.shortCanvasLabel(focusRecipe.name, 18), assemblyX + assemblyWidth / 2, assemblyY + 44);

    const droneX = assemblyX + assemblyWidth / 2;
    const droneY = assemblyY + 74;
    ctx.strokeStyle = ready ? "#61d394" : "#b0845f";
    ctx.fillStyle = ready ? "rgba(97, 211, 148, 0.28)" : "rgba(176, 132, 95, 0.22)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(droneX - 36, droneY);
    ctx.lineTo(droneX + 36, droneY);
    ctx.moveTo(droneX, droneY - 20);
    ctx.lineTo(droneX, droneY + 20);
    ctx.stroke();
    [[-42, 0], [42, 0], [0, -26], [0, 26]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(droneX + dx, droneY + dy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.arc(droneX, droneY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  roundCanvasRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  shortCanvasLabel(label, maxLength) {
    return label.length > maxLength ? `${label.slice(0, maxLength - 1)}.` : label;
  }

  renderFactoryStatus(now = Date.now()) {
    const focusRecipeId = this.cardFactorySystem.getRecommendedRecipeId();
    const deficits = this.cardFactorySystem.getRecipeDeficit(focusRecipeId) || {};
    const deficitText = Object.entries(deficits)
      .filter(([, qty]) => qty > 0)
      .map(([componentId, qty]) => `${componentId}:${formatNumber(qty)}`)
      .join(" ");
    this.ui.dom.inventorySummary.textContent = `Inventario: ${this.cardFactorySystem.getInventorySummaryText()} | Objetivo: ${focusRecipeId}${deficitText ? ` | Faltan ${deficitText}` : " | Lista para ensamblar"}`;
    const multipliers = this.cardFactorySystem.getEventMultipliers(now);
    const active = multipliers.activeEvent;
    if (active && this.state.factory.event.activeEvent) {
      const remaining = Math.max(0, (this.state.factory.event.activeEvent.expiresAt - now) / 1000);
      this.ui.dom.eventStatus.textContent = `${active.name}: ${active.description} (${formatDuration(remaining)})`;
    } else {
      const cooldownMs = Math.max(0, this.state.factory.event.eventCooldownUntil - now);
      this.ui.dom.eventStatus.textContent = cooldownMs > 0
        ? `Siguiente evento en ${formatDuration(cooldownMs / 1000)}.`
        : "Sin evento activo.";
    }
    this.ui.dom.drawEventBtn.disabled = now < this.state.factory.event.eventCooldownUntil;
  }

  renderBoostInfo(now = Date.now()) {
    if (now < this.state.adBoostExpiresAt) {
      this.ui.dom.boostHint.textContent = `Boost activo x2 (${formatDuration((this.state.adBoostExpiresAt - now) / 1000)}).`;
      this.ui.dom.adBoostBtn.disabled = true;
    } else if (now < this.state.adBoostCooldownUntil) {
      this.ui.dom.boostHint.textContent = `Rewarded disponible en ${formatDuration((this.state.adBoostCooldownUntil - now) / 1000)}.`;
      this.ui.dom.adBoostBtn.disabled = true;
    } else {
      this.ui.dom.boostHint.textContent = "Boost inactivo (rewarded listo).";
      this.ui.dom.adBoostBtn.disabled = false;
    }

    this.ui.dom.adBonusBtn.disabled = now < this.state.adBonusCooldownUntil;
  }

  renderMilestoneInfo() {
    const next = MILESTONE_DEFS.find((def) => !this.state.claimedMilestones[def.id]);
    if (!next) {
      this.ui.dom.milestoneText.textContent = "Hitos completados: bonus maximo activo.";
      return;
    }
    const pct = clamp((this.state.lifetimeEnergy / next.threshold) * 100, 0, 100);
    this.ui.dom.milestoneText.textContent = `Proximo hito: ${next.label} (${pct.toFixed(1)}%).`;
  }

  renderMultiplierHud(breakdown, now = Date.now()) {
    const prestigeMult = this.prestigeSystem.getMultiplier();
    const milestoneMult = this.getMilestoneMultiplier();
    const rewardedMult = this.getAdBoostMultiplier(now);
    const upgradesMult = breakdown.speedMultiplier *
      breakdown.upgradeGlobalMultiplier *
      breakdown.droneSynergyMultiplier *
      breakdown.replicationMultiplier;
    const totalMult = upgradesMult *
      breakdown.momentumMultiplier *
      breakdown.progressionMultiplier *
      prestigeMult *
      milestoneMult *
      rewardedMult;

    this.ui.dom.multPrestige.textContent = `x${prestigeMult.toFixed(2)}`;
    this.ui.dom.multMilestones.textContent = `x${milestoneMult.toFixed(2)}`;
    this.ui.dom.multUpgrades.textContent = `x${upgradesMult.toFixed(2)}`;
    this.ui.dom.multMomentum.textContent = `x${breakdown.momentumMultiplier.toFixed(2)}`;
    this.ui.dom.multProgression.textContent = `x${breakdown.progressionMultiplier.toFixed(2)}`;
    this.ui.dom.multRewarded.textContent = `x${rewardedMult.toFixed(2)}`;
    this.ui.dom.multTotal.textContent = `x${totalMult.toFixed(2)}`;

    if (now < this.state.adBoostExpiresAt) {
      this.ui.dom.adBoostTimer.textContent = `Rewarded activo: ${formatDuration((this.state.adBoostExpiresAt - now) / 1000)} restante(s).`;
    } else if (now < this.state.adBoostCooldownUntil) {
      this.ui.dom.adBoostTimer.textContent = `Rewarded en cooldown: ${formatDuration((this.state.adBoostCooldownUntil - now) / 1000)}.`;
    } else {
      this.ui.dom.adBoostTimer.textContent = "Rewarded listo para activar.";
    }

    this.ui.dom.prestigeMultiplierLabel.textContent = `Global x${totalMult.toFixed(2)} | EPS fabrica de cartas: ${formatNumber(this.lastComputedFactoryEPS)}`;
  }

  getNextUnlockTarget() {
    const candidates = [];
    FACTORY_STATION_DEFS.forEach((def) => {
      if (!this.isStationUnlocked(def)) {
        candidates.push({ threshold: def.unlockAt, label: `Estacion: ${def.name}` });
      }
    });
    DRONE_RECIPE_DEFS.forEach((def) => {
      if (!this.isRecipeUnlocked(def)) {
        candidates.push({ threshold: def.unlockAt, label: `Drone: ${def.name}` });
      }
    });
    const nextMilestone = MILESTONE_DEFS.find((def) => !this.state.claimedMilestones[def.id]);
    if (nextMilestone) candidates.push({ threshold: nextMilestone.threshold, label: `Hito: ${nextMilestone.label}` });
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.threshold - b.threshold);
    return candidates[0];
  }

  renderNextUnlockProgress() {
    const next = this.getNextUnlockTarget();
    if (!next) {
      this.ui.dom.nextUnlockLabel.textContent = "Todo desbloqueado.";
      this.ui.dom.nextUnlockPercent.textContent = "100%";
      this.ui.dom.nextUnlockProgress.value = 100;
      return;
    }
    const pct = safePercentage((this.state.lifetimeEnergy / next.threshold) * 100);
    this.ui.dom.nextUnlockLabel.textContent = `${next.label} (${formatNumber(next.threshold)} energia de vida)`;
    this.ui.dom.nextUnlockPercent.textContent = `${pct.toFixed(1)}%`;
    this.ui.dom.nextUnlockProgress.value = pct;
  }

  getOnboardingStepProgress(step) {
    switch (step.type) {
      case "componentsCrafted":
        return this.state.factory.lifetimeComponentsCrafted || 0;
      case "recipeBuilt":
        return this.state.factory.dronesBuilt[step.recipeId] || 0;
      case "stationAny":
        return Math.max(...Object.values(this.state.factory.stationLevels || { base: 1 }));
      case "contractsClaimed":
        return this.state.factory.contractsClaimed || 0;
      default:
        return 0;
    }
  }

  evaluateOnboarding() {
    const allComplete = ONBOARDING_STEPS.every((step) => this.getOnboardingStepProgress(step) >= step.target);
    if (allComplete && !this.state.onboardingCompleted) {
      this.state.onboardingCompleted = true;
      this.guideVisible = false;
      this.ui.setModalVisible(false);
      this.setStatus("Objetivos iniciales completados. Sigue hacia prestigio.", 3000);
      this.save(true);
    }
  }

  renderOnboardingProgress() {
    const list = this.ui.dom.onboardingSteps;
    const fragment = document.createDocumentFragment ? document.createDocumentFragment() : null;
    list.innerHTML = "";
    ONBOARDING_STEPS.forEach((step, index) => {
      const progress = this.getOnboardingStepProgress(step);
      const done = progress >= step.target;
      const li = document.createElement("li");
      li.className = done ? "onboard-done" : index === 0 || this.getOnboardingStepProgress(ONBOARDING_STEPS[index - 1]) >= ONBOARDING_STEPS[index - 1].target ? "onboard-active" : "";
      li.textContent = `${done ? "[OK]" : "[ ]"} ${step.label} (${formatNumber(Math.min(progress, step.target))}/${formatNumber(step.target)})`;
      if (fragment) fragment.appendChild(li);
      else list.appendChild(li);
    });
    if (fragment && list.replaceChildren) list.replaceChildren(fragment);

    if (this.state.onboardingCompleted) {
      this.ui.dom.onboardingProgressTitle.textContent = "Guia completada. Reabre cuando quieras con tecla G.";
    } else {
      this.ui.dom.onboardingProgressTitle.textContent = "Ruta recomendada (60-90s): completa estos pasos en orden.";
    }
  }

  renderTelemetrySummary() {
    const summary = this.telemetry.getSummary();
    const firstPrestige = summary.firstPrestigeMinutes === null ? "-" : `${summary.firstPrestigeMinutes.toFixed(1)} min`;
    this.ui.dom.telemetrySummary.textContent =
      `Sesiones: ${summary.sessions} | Avg sesion: ${formatDuration(summary.avgSessionSeconds)} | Churn<2m: ${(summary.churnRate * 100).toFixed(1)}% | Conversion diaria: ${(summary.missionConversion * 100).toFixed(1)}% | Craft:${summary.totalFactoryCrafts} | Drones:${summary.totalDroneAssemblies} | Contratos:${summary.totalContractClaims} | Eventos:${summary.totalEventDraws} | Primer prestigio: ${firstPrestige}`;
  }

  shouldRefreshCatalog(now, isForced) {
    if (isForced || this.catalogDirty) return true;
    return now - this.lastCatalogRefresh > 900;
  }

  render(isForced = false) {
    const now = Date.now();
    this.updateAutoClean(now);
    const externalMultiplier = this.getGlobalMultiplier(now);
    const breakdown = this.economySystem.getProductionBreakdown(externalMultiplier);
    this.lastComputedFactoryEPS = this.cardFactorySystem.getFleetEPS(now) * externalMultiplier;
    this.lastComputedEPS = breakdown.totalEps + this.lastComputedFactoryEPS;
    this.state.drones = this.state.factory.lifetimeDronesBuilt || 0;
    this.state.dailyProgress.maxEps = Math.max(this.state.dailyProgress.maxEps, this.lastComputedEPS);
    this.state.lifetimeMaxEps = Math.max(this.state.lifetimeMaxEps || 0, this.lastComputedEPS);

    this.evaluateOnboarding();
    this.ui.renderResourceValues(this.state, this.lastComputedEPS);

    const gain = this.prestigeSystem.getPotentialGain();
    const needed = Math.max(0, 500000 - this.state.lifetimeEnergy);
    this.ui.dom.prestigeBtn.disabled = gain <= 0;
    this.ui.dom.prestigeHint.textContent = gain > 0
      ? `Prestigio disponible: +${gain} Nucleo(s)`
      : `Necesitas ${formatNumber(needed)} energia de vida para el siguiente Nucleo`;

    const completed = this.state.dailyMissions.filter((item) => item.claimed).length;
    this.ui.dom.dailyStreakLabel.textContent = `Racha diaria: ${this.state.dailyStreak} | Misiones: ${completed}/${this.state.dailyMissions.length}`;

    if (Date.now() < this.statusExpiresAt) this.ui.dom.statusText.textContent = this.statusText;
    else this.ui.dom.statusText.textContent = "Atajos: Espacio=click, 1/2/3=compra, G=guia.";
    this.ui.dom.shortcutHint.textContent = "Atajos: Espacio click | 1 x1 | 2 x10 | 3 max | G guia";

    this.renderBoostInfo(now);
    this.updateBonusTrayVisibility(now);
    this.renderMultiplierHud(breakdown, now);

    const shouldRefreshSecondary = isForced || (now - this.lastSecondaryUIRefresh >= SECONDARY_UI_REFRESH_MS);
    if (shouldRefreshSecondary) {
      this.renderFactoryOverview(now);
      this.renderFactoryStatus(now);
      this.renderMilestoneInfo();
      this.renderNextUnlockProgress();
      this.lastSecondaryUIRefresh = now;
    }

    const shouldRefreshOnboarding = isForced || (this.guideVisible && now - this.lastOnboardingRefresh >= ONBOARDING_REFRESH_MS);
    if (shouldRefreshOnboarding) {
      this.renderOnboardingProgress();
      this.lastOnboardingRefresh = now;
    }

    const shouldRefreshTelemetry = isForced || (now - this.lastTelemetryRefresh >= TELEMETRY_REFRESH_MS);
    if (shouldRefreshTelemetry) {
      this.renderTelemetrySummary();
      this.lastTelemetryRefresh = now;
    }

    if (this.shouldRefreshCatalog(now, isForced)) {
      if (now < this.catalogLoadingUntil) {
        this.renderCatalogSkeletons();
        return;
      }
      this.renderMachineList();
      this.renderUpgradeList();
      this.renderMissionList();
      this.renderContractList();
      this.catalogDirty = false;
      this.lastCatalogRefresh = now;
    }
  }

  loop(timestamp) {
    const deltaSeconds = Math.min(1, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;

    const globalMult = this.getGlobalMultiplier();
    const eps = this.economySystem.computeEPS(globalMult) + this.cardFactorySystem.getFleetEPS() * globalMult;
    this.lastComputedEPS = eps;
    this.state.drones = this.state.factory.lifetimeDronesBuilt || 0;
    this.state.dailyProgress.maxEps = Math.max(this.state.dailyProgress.maxEps, eps);
    this.state.lifetimeMaxEps = Math.max(this.state.lifetimeMaxEps || 0, eps);
    this.resourceSystem.tick(deltaSeconds, eps);

    if (timestamp - this.lastMetaCheck >= META_CHECK_MS) {
      this.ensureDailyCycle(true);
      this.checkMilestones();
      this.lastMetaCheck = timestamp;
    }

    if (timestamp - this.lastUIRefresh >= UI_REFRESH_MS) {
      this.render(false);
      this.lastUIRefresh = timestamp;
    }

    requestAnimationFrame(this.loop);
  }
}
