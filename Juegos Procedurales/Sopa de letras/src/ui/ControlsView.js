export class ControlsView {
  constructor(refs) {
    this.refs = refs;
    this.bound = false;
  }

  bind(callbacks) {
    if (this.bound) {
      return;
    }

    this.bound = true;
    this.callbacks = callbacks;

    [this.refs.homeCategory, this.refs.panelCategory].forEach((selectElement) => {
      selectElement.addEventListener('change', () => {
        this.callbacks.onSettingsChange({ category: selectElement.value });
      });
    });

    [this.refs.homeSeed, this.refs.panelSeed].forEach((inputElement) => {
      inputElement.addEventListener('input', () => {
        this.callbacks.onSettingsChange({ customSeed: inputElement.value });
      });
    });

    [this.refs.homeDailySeed, this.refs.panelDailySeed].forEach((buttonElement) => {
      buttonElement.addEventListener('click', () => this.callbacks.onUseDailySeed());
    });

    [this.refs.homeDifficulty, this.refs.panelDifficulty].forEach((difficultyGroup) => {
      difficultyGroup.addEventListener('click', (event) => {
        const button = event.target.closest('[data-difficulty]');

        if (!button) {
          return;
        }

        this.callbacks.onSettingsChange({
          difficulty: button.dataset.difficulty,
        });
      });
    });

    [this.refs.homePlayMode, this.refs.panelPlayMode].forEach((group) => {
      group.addEventListener('click', (event) => {
        const button = event.target.closest('[data-play-mode]');

        if (!button) {
          return;
        }

        this.callbacks.onSettingsChange({
          playMode: button.dataset.playMode,
        });
      });
    });

    [this.refs.homeTimerMode, this.refs.panelTimerMode].forEach((group) => {
      group.addEventListener('click', (event) => {
        const button = event.target.closest('[data-timer-mode]');

        if (!button) {
          return;
        }

        this.callbacks.onSettingsChange({
          timerMode: button.dataset.timerMode,
        });
      });
    });

    this.refs.homeNewGame.addEventListener('click', () => this.callbacks.onStartNewGame());
    this.refs.homeDailyGame.addEventListener('click', () => this.callbacks.onStartDailyGame());
    this.refs.homeContinueGame.addEventListener('click', () => this.callbacks.onContinueGame());
    this.refs.pauseButton.addEventListener('click', () => this.callbacks.onPauseToggle());
    this.refs.restartButton.addEventListener('click', () => this.callbacks.onRestartGame());
    this.refs.newButton.addEventListener('click', () => this.callbacks.onStartNewGame());
    this.refs.hintButton.addEventListener('click', () => this.callbacks.onUseHint());
    this.refs.shareButton.addEventListener('click', () => this.callbacks.onShareCurrentGame());
    this.refs.gameHome.addEventListener('click', () => this.callbacks.onOpenHome());
    this.refs.settingsToggle.addEventListener('click', () => this.callbacks.onToggleSettingsPanel());
    this.refs.settingsClose.addEventListener('click', () => this.callbacks.onToggleSettingsPanel());
    this.refs.themeButton.addEventListener('click', () => this.callbacks.onToggleTheme());
    this.refs.homeThemeToggle.addEventListener('click', () => this.callbacks.onToggleTheme());
    this.refs.homePackAdd.addEventListener('click', () => this.submitPackSource());
    this.refs.homePackClear.addEventListener('click', () => this.callbacks.onClearPackSources());
    this.refs.homePackUrl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.submitPackSource();
      }
    });
    this.refs.homePackSources.addEventListener('click', (event) => {
      const toggleButton = event.target.closest('[data-source-toggle]');
      const removeButton = event.target.closest('[data-source-remove]');

      if (toggleButton) {
        this.callbacks.onToggleSource(toggleButton.dataset.sourceToggle);
      }

      if (removeButton) {
        this.callbacks.onRemoveSource(removeButton.dataset.sourceRemove);
      }
    });
  }

  render({
    settings,
    categories,
    sources,
    difficulties,
    playModes,
    timerModes,
    dailyAction,
    canContinue,
    paused,
    canPause,
    theme,
    isSettingsPanelOpen,
    hasActiveGame,
    canHint,
    canEarnRewardedHint,
    remainingHints,
  }) {
    this.ensureCategoryOptions(this.refs.homeCategory, categories);
    this.ensureCategoryOptions(this.refs.panelCategory, categories);
    this.ensureButtons(this.refs.homeDifficulty, difficulties, 'difficulty');
    this.ensureButtons(this.refs.panelDifficulty, difficulties, 'difficulty');
    this.ensureButtons(this.refs.homePlayMode, playModes, 'play-mode');
    this.ensureButtons(this.refs.panelPlayMode, playModes, 'play-mode');
    this.ensureButtons(this.refs.homeTimerMode, timerModes, 'timer-mode');
    this.ensureButtons(this.refs.panelTimerMode, timerModes, 'timer-mode');

    this.refs.homeCategory.value = settings.category;
    this.refs.panelCategory.value = settings.category;
    this.syncInputValue(this.refs.homeSeed, settings.customSeed);
    this.syncInputValue(this.refs.panelSeed, settings.customSeed);
    this.refs.homeSeed.disabled = settings.playMode === 'daily';
    this.refs.panelSeed.disabled = settings.playMode === 'daily';
    this.refs.homeContinueGame.hidden = !canContinue;
    this.refs.pauseButton.textContent = paused ? 'Reanudar' : 'Pausar';
    this.refs.pauseButton.disabled = !canPause;
    this.refs.restartButton.disabled = !hasActiveGame;
    this.refs.shareButton.disabled = !hasActiveGame;
    this.refs.hintButton.disabled = !canHint;
    this.refs.hintButton.textContent = remainingHints > 0
      ? `Pista (${remainingHints})`
      : (canEarnRewardedHint ? 'Reward +1' : 'Sin pistas');
    this.refs.settingsPanel.classList.toggle('is-open', isSettingsPanelOpen);
    this.refs.settingsPanel.setAttribute('aria-hidden', String(!isSettingsPanelOpen));
    this.refs.homePackClear.disabled = settings.externalPackUrls.length === 0;
    this.refs.homeDailyGame.textContent = dailyAction.label;
    this.refs.homeDailyGame.disabled = Boolean(dailyAction.disabled);

    const nextThemeLabel = theme === 'dark' ? 'Tema claro' : 'Tema oscuro';
    this.refs.themeButton.textContent = nextThemeLabel;
    this.refs.homeThemeToggle.textContent = nextThemeLabel;

    this.updateSegmentState(this.refs.homeDifficulty, settings.difficulty, 'difficulty');
    this.updateSegmentState(this.refs.panelDifficulty, settings.difficulty, 'difficulty');
    this.updateSegmentState(this.refs.homePlayMode, settings.playMode, 'play-mode');
    this.updateSegmentState(this.refs.panelPlayMode, settings.playMode, 'play-mode');
    this.updateSegmentState(this.refs.homeTimerMode, settings.timerMode, 'timer-mode');
    this.updateSegmentState(this.refs.panelTimerMode, settings.timerMode, 'timer-mode');
    this.renderSourcesList(this.refs.homePackSources, sources);
  }

  submitPackSource() {
    this.callbacks.onAddPackSource(this.refs.homePackUrl.value);
    this.refs.homePackUrl.value = '';
  }

  ensureCategoryOptions(selectElement, categories) {
    const signature = categories.map((category) => category.id).join('|');

    if (selectElement.dataset.signature === signature) {
      return;
    }

    selectElement.innerHTML = categories.map((category) => `
      <option value="${category.id}">
        ${category.label}${category.isExternal ? ` · ${category.sourceLabel}` : ''}
      </option>
    `).join('');
    selectElement.dataset.signature = signature;
  }

  ensureButtons(container, options, kind) {
    const signature = options.map((option) => option.id).join('|');

    if (container.dataset.signature === signature) {
      return;
    }

    const dataAttribute = `data-${kind}`;
    const className = kind === 'difficulty' ? 'segment-button' : 'segment-button segment-button--soft';

    container.innerHTML = options.map((option) => `
      <button
        type="button"
        class="${className}"
        ${dataAttribute}="${option.id}"
        aria-pressed="false"
      >
        <span>${option.label}</span>
        <small>${this.getButtonHint(option, kind)}</small>
      </button>
    `).join('');
    container.dataset.signature = signature;
  }

  updateSegmentState(container, activeValue, kind) {
    const selector = kind === 'difficulty'
      ? '[data-difficulty]'
      : kind === 'play-mode'
        ? '[data-play-mode]'
        : '[data-timer-mode]';

    container.querySelectorAll(selector).forEach((button) => {
      const dataKey = kind === 'difficulty'
        ? button.dataset.difficulty
        : kind === 'play-mode'
          ? button.dataset.playMode
          : button.dataset.timerMode;
      const isActive = dataKey === activeValue;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  renderSourcesList(container, sources) {
    container.innerHTML = sources.map((source) => `
      <article class="source-chip ${source.isBuiltIn ? 'is-built-in' : ''} ${!source.isActive ? 'is-inactive' : ''}">
        <div class="source-chip__meta">
          <strong>${source.label}</strong>
          <span>${source.categoryCount} packs · ${source.isActive ? 'Activo' : 'Pausado'}</span>
        </div>
        <div class="source-chip__actions">
          ${source.isToggleable ? `
            <button type="button" class="button button--ghost button--mini" data-source-toggle="${source.id}">
              ${source.isActive ? 'Desactivar' : 'Activar'}
            </button>
          ` : ''}
          ${source.isRemovable ? `
            <button type="button" class="button button--ghost button--mini" data-source-remove="${source.id}">
              Quitar
            </button>
          ` : ''}
        </div>
      </article>
    `).join('');
  }

  getButtonHint(option, kind) {
    if (kind === 'difficulty') {
      return `${option.size}x${option.size}`;
    }

    return option.hint || option.description || '';
  }

  syncInputValue(inputElement, nextValue) {
    if (document.activeElement === inputElement) {
      return;
    }

    inputElement.value = nextValue;
  }
}
