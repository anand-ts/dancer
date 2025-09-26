import { AUDIO_CONFIG, STATUS_MESSAGES } from '../config.js';

export default class AudioManager {
  constructor(domCache, statusManager) {
    this.audioPlayer = domCache.get('audioPlayer');
    this.playButton = domCache.get('playButton');
    this.trackInfoDisplay = domCache.get('trackInfo');
    this.miniTrackInfoDisplay = domCache.get('miniTrackInfo');
    this.miniPlayButton = domCache.get('miniPlayButton');
    this.miniNextButton = domCache.get('miniNextButton');
    this.statusManager = statusManager;

    this.audioContext = null;
    this.analyser = null;
    this.audioSource = null;
    this.frequencyData = null;

    this.playlist = [];
    this.currentTrackIndex = 0;
    this.suppressPauseStatus = false;
  }

  setupEventListeners(onPlay, onPause) {
    if (!this.audioPlayer) return;

    this.audioPlayer.addEventListener('play', onPlay);
    this.audioPlayer.addEventListener('pause', onPause);

    const toggleHandler = () => this.togglePlayback();

    if (this.playButton) {
      this.playButton.addEventListener('click', toggleHandler);
    }

    if (this.miniPlayButton) {
      this.miniPlayButton.addEventListener('click', toggleHandler);
      this.miniPlayButton.addEventListener('mousedown', (event) => event.stopPropagation());
    }

    if (this.miniNextButton) {
      this.miniNextButton.addEventListener('click', () => {
        const shouldAutoplay = !this.audioPlayer.paused;
        this.playNextTrack({ autoPlay: shouldAutoplay });
      });
      this.miniNextButton.addEventListener('mousedown', (event) => event.stopPropagation());
    }

    this.audioPlayer.addEventListener('play', () => {
      this.syncPlayButtons(true);
      this.statusManager.setStatus(STATUS_MESSAGES.VISUALIZING);
    });

    this.audioPlayer.addEventListener('pause', () => {
      this.syncPlayButtons(false);
      if (this.suppressPauseStatus) {
        this.suppressPauseStatus = false;
        return;
      }
      this.statusManager.setStatus(STATUS_MESSAGES.PAUSED);
    });

    this.audioPlayer.addEventListener('loadstart', () => {
      this.statusManager.setStatus(STATUS_MESSAGES.LOADING);
    });

    this.audioPlayer.addEventListener('canplay', () => {
      this.statusManager.setStatus(STATUS_MESSAGES.READY);
    });

    this.audioPlayer.addEventListener('loadeddata', () => {
      this.statusManager.setStatus(STATUS_MESSAGES.LOADED);
    });

    this.audioPlayer.addEventListener('ended', () => {
      this.playNextTrack({ autoPlay: true, triggeredByEnd: true });
    });

    this.audioPlayer.addEventListener('error', (event) => {
      this.handleAudioError(event);
    });

    this.initializePlaylist();
  }

  togglePlayback() {
    if (!this.audioPlayer) return;

    if (this.audioPlayer.paused) {
      this.audioPlayer.play();
    } else {
      this.audioPlayer.pause();
    }
  }

  syncPlayButtons(isPlaying) {
    const label = isPlaying ? '⏸ PAUSE' : '▶ PLAY';

    if (this.playButton) {
      this.playButton.textContent = label;
    }

    if (this.miniPlayButton) {
      this.miniPlayButton.textContent = label;
    }
  }

  initializePlaylist() {
    if (!this.audioPlayer) return;

    const sources = Array.from(this.audioPlayer.querySelectorAll('source'));

    if (sources.length) {
      this.playlist = sources.map((source) => {
        const rawSrc = source.getAttribute('src') || '';
        const resolvedSrc = source.src || rawSrc;
        const titleAttr = source.getAttribute('data-title');

        return {
          src: resolvedSrc,
          title: titleAttr || this.formatTrackTitle(rawSrc || resolvedSrc),
          isObjectURL: false
        };
      });
    } else {
      const existingSrc = this.audioPlayer.currentSrc || this.audioPlayer.getAttribute('src');
      if (existingSrc) {
        this.playlist.push({
          src: existingSrc,
          title: (this.trackInfoDisplay && this.trackInfoDisplay.textContent.trim()) || this.formatTrackTitle(existingSrc),
          isObjectURL: false
        });
      }
    }

    if (!this.playlist.length) return;

    this.currentTrackIndex = Math.min(this.currentTrackIndex, this.playlist.length - 1);
    const initialTrack = this.playlist[this.currentTrackIndex];

    if (!this.isSameSource(this.audioPlayer.currentSrc, initialTrack.src)) {
      this.audioPlayer.src = initialTrack.src;
      this.audioPlayer.load();
    }

    this.updateTrackDisplays(initialTrack.title);
    this.syncPlayButtons(!this.audioPlayer.paused);
  }

  addTracksFromDrop(files) {
    if (!files || !files.length) return false;

    const audioFiles = files.filter((file) => file.type.startsWith('audio/'));

    if (!audioFiles.length) {
      this.statusManager.setStatus('Error: Please drop an audio file');
      return false;
    }

    this.statusManager.setStatus('Loading new audio file...');

    const newTracks = audioFiles.map((file) => ({
      src: URL.createObjectURL(file),
      title: this.formatTrackTitle(file.name),
      isObjectURL: true
    }));

    const nextIndex = this.playlist.length;
    this.playlist.push(...newTracks);
    this.loadTrack(nextIndex, { autoPlay: false });
    this.statusManager.setStatus('New audio file loaded - Ready to play');

    return true;
  }

  loadTrack(index, { autoPlay = false, preserveState = false } = {}) {
    if (!this.playlist.length) return;

    const boundedIndex = Math.max(0, Math.min(index, this.playlist.length - 1));
    const wasPlaying = !this.audioPlayer.paused;

    this.currentTrackIndex = boundedIndex;
    const track = this.playlist[boundedIndex];

    if (!this.isSameSource(this.audioPlayer.currentSrc, track.src)) {
      this.audioPlayer.src = track.src;
      this.audioPlayer.load();
    } else {
      this.audioPlayer.currentTime = 0;
    }

    this.updateTrackDisplays(track.title);
    this.syncPlayButtons(false);
    this.statusManager.setStatus(STATUS_MESSAGES.READY);

    const shouldAutoPlay = autoPlay || (preserveState && wasPlaying);

    if (shouldAutoPlay) {
      this.audioPlayer.play();
    } else if (!this.audioPlayer.paused) {
      this.suppressPauseStatus = true;
      this.audioPlayer.pause();
    }
  }

  playNextTrack({ autoPlay = true, triggeredByEnd = false } = {}) {
    if (!this.playlist.length) return;

    const shouldAutoPlay = autoPlay || triggeredByEnd;

    if (this.playlist.length === 1) {
      this.audioPlayer.currentTime = 0;
      if (shouldAutoPlay) {
        this.audioPlayer.play();
      }
      return;
    }

    const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    this.loadTrack(nextIndex, { autoPlay: shouldAutoPlay, preserveState: true });
  }

  updateTrackDisplays(title) {
    const safeTitle = title || 'Unknown Track';

    if (this.trackInfoDisplay) {
      this.trackInfoDisplay.textContent = safeTitle;
    }

    if (this.miniTrackInfoDisplay) {
      this.miniTrackInfoDisplay.textContent = safeTitle;
    }
  }

  normaliseSrc(src) {
    if (!src) return '';
    const link = document.createElement('a');
    link.href = src;
    return link.href;
  }

  isSameSource(first, second) {
    if (!first || !second) return false;
    return this.normaliseSrc(first) === this.normaliseSrc(second);
  }

  formatTrackTitle(sourcePath) {
    if (!sourcePath) return 'Unknown Track';

    const sanitizedPath = sourcePath.split('?')[0];
    const parts = sanitizedPath.split('/');
    const fileName = parts[parts.length - 1] || sanitizedPath;
    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');

    return nameWithoutExtension.replace(/[-_]/g, ' ').trim() || 'Unknown Track';
  }

  handleAudioError(event) {
    console.error('Audio error:', event);
    console.error('Audio error details:', this.audioPlayer.error);

    const error = this.audioPlayer.error;
    const errorMsg = error ?
      `Audio error (${error.code}): ${error.message || 'Unknown error'}` :
      'Audio file not found or cannot be loaded';

    this.statusManager.setStatus(errorMsg);
  }

  async setupAudioContext() {
    try {
      if (!this.audioContext) {
        console.log('Setting up audio context...');

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created');

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;
        this.analyser.smoothingTimeConstant = AUDIO_CONFIG.SMOOTHING;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        console.log('Analyser created');

        this.audioSource = this.audioContext.createMediaElementSource(this.audioPlayer);
        this.audioSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        console.log('Audio nodes connected');
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('Audio context resumed');
      }

      this.statusManager.setStatus(STATUS_MESSAGES.VISUALIZING);
      return true;
    } catch (error) {
      console.error('Audio setup error:', error);
      this.statusManager.setStatus('Audio error: ' + error.message);
      return false;
    }
  }

  getFrequencyData() {
    if (this.analyser && this.frequencyData) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      return this.frequencyData;
    }
    return null;
  }

  calculateAudioLevel() {
    if (!this.frequencyData) return 0;
    const avgLevel = this.frequencyData.reduce((sum, val) => sum + val, 0) / this.frequencyData.length;
    return Math.round((avgLevel / 255) * 100);
  }

  isPaused() {
    return this.audioPlayer ? this.audioPlayer.paused : true;
  }
}
