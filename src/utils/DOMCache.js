import { DOM_ELEMENTS } from '../config.js';

export default class DOMCache {
  constructor() {
    this.elements = {
      canvas: document.getElementById(DOM_ELEMENTS.CANVAS),
      audioPlayer: document.getElementById(DOM_ELEMENTS.AUDIO_PLAYER),
      playButton: document.getElementById(DOM_ELEMENTS.PLAY_BUTTON),
      status: document.getElementById(DOM_ELEMENTS.STATUS),
      levelFill: document.getElementById(DOM_ELEMENTS.LEVEL_FILL),
      levelText: document.getElementById(DOM_ELEMENTS.LEVEL_TEXT),
      controls: document.getElementById('controls')
    };
  }

  get(elementName) {
    return this.elements[elementName];
  }
}
