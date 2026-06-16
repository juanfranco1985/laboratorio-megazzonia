export class ResourceSystem {
  constructor(state) {
    this.state = state;
  }

  addEnergy(amount, source = "generic") {
    if (amount <= 0 || !Number.isFinite(amount)) return;
    this.state.energy += amount;
    this.state.lifetimeEnergy += amount;
    if (this.state.dailyProgress && source !== "spend") {
      this.state.dailyProgress.energyGenerated += amount;
    }
  }

  spendEnergy(amount) {
    if (amount <= 0) return true;
    if (this.state.energy + 1e-9 < amount) return false;
    this.state.energy -= amount;
    return true;
  }

  tick(deltaSeconds, eps) {
    this.state.clickMomentum = Math.max(0, this.state.clickMomentum - deltaSeconds * 1.2);
    this.addEnergy(eps * deltaSeconds, "production");
  }

  manualClick(clickValue) {
    this.addEnergy(clickValue, "click");
    this.state.clickMomentum = Math.min(50, this.state.clickMomentum + 0.8);
    if (this.state.dailyProgress) this.state.dailyProgress.clicks += 1;
    this.state.onboardingClicks = (this.state.onboardingClicks || 0) + 1;
  }
}
