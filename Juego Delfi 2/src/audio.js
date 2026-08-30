class SynthAudio {
  constructor() { this.context = null; this.muted = false; }
  toggle() { this.muted = !this.muted; return this.muted; }
  play(kind) {
    if (this.muted) return;
    try {
      this.context ||= new (window.AudioContext || window.webkitAudioContext)();
      const [frequency, duration, type] = {
        jump:[420,.08,"square"], crystal:[760,.12,"sine"], hit:[105,.18,"sawtooth"],
        shoot:[280,.08,"triangle"], checkpoint:[540,.2,"sine"], portal:[880,.35,"sine"], enemy:[170,.1,"square"],
      }[kind] || [300,.08,"sine"];
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gain.gain.setValueAtTime(.045, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, this.context.currentTime + duration);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start();
      oscillator.stop(this.context.currentTime + duration);
    } catch { /* Web Audio es una mejora opcional. */ }
  }
}
export const audio = new SynthAudio();
