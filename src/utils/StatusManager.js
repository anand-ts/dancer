export default class StatusManager {
  constructor(domCache) {
    this.statusElement = domCache.get('status');
    this.levelFillElement = domCache.get('levelFill');
    this.levelTextElement = domCache.get('levelText');
  }

  setStatus(message) {
    this.statusElement.textContent = message;
    console.log('Status:', message);
  }

  updateAudioLevel(percentage) {
    this.levelFillElement.style.width = percentage + '%';
    this.levelTextElement.textContent = percentage;
  }

  resetAudioLevel() {
    this.updateAudioLevel(0);
  }
}
