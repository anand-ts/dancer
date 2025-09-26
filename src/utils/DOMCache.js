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
      controls: document.getElementById('controls'),
      trackInfo: document.getElementById(DOM_ELEMENTS.TRACK_INFO),
      minimizeButton: document.getElementById(DOM_ELEMENTS.MINIMIZE_BUTTON),
      miniPlayer: document.getElementById(DOM_ELEMENTS.MINI_PLAYER),
      miniTrackInfo: document.getElementById(DOM_ELEMENTS.MINI_TRACK_INFO),
      miniPlayButton: document.getElementById(DOM_ELEMENTS.MINI_PLAY_BUTTON),
      miniNextButton: document.getElementById(DOM_ELEMENTS.MINI_NEXT_BUTTON)
    };
  }

  get(elementName) {
    return this.elements[elementName];
  }
}
