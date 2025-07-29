# Dancer - Web Audio Visualizer

A simple, elegant music visualizer built with **Web Audio API** and **HTML5 Canvas**. Features real-time frequency visualization with colorful bars that dance to your music.

<p align="center">
  <img src="public/dancer.gif" alt="Dancer Visualizer Demo" width="500" />
  <br/>
  <em style="font-size:1.1em; color:#4caf50;">Real-time frequency bars with Web Audio API</em>
</p>

## 🎵 Current Solution

**Frontend-only approach** using modern web technologies:

- **HTML5 Audio API** - Native browser audio playback
- **Web Audio API** - Real-time frequency analysis  
- **2D Canvas API** - Smooth frequency bar visualization
- **Vite** - Fast development and build tool
- **Pure JavaScript** - No complex frameworks needed

## 🚀 Features

- **Full-screen visualizer** with frequency bars
- **Top-left control panel** with audio controls
- **Real-time audio level meter**
- **Responsive design** that adapts to window size
- **Hot reload** development experience

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5174/ and press play to start visualizing!

## 📁 Project Structure

```
src/
├── index.html          # Main HTML with audio controls
├── main.js            # Modular visualizer components
├── config.js          # Configuration constants
├── styles.css         # CSS with custom properties
└── assets/
    └── Cult Member - Faygo.m4a  # Audio file

public/
└── dancer.gif         # Demo GIF for README

Root files:
├── CLAUDE.md          # Development guidelines and project context
├── README.md          # Project documentation
├── package.json       # Dependencies and scripts
└── vite.config.js     # Vite configuration
```

## 🏗️ Architecture

The application is built with a modular, object-oriented architecture:

- **`WaveformVisualizer`** - Main application controller
- **`AudioManager`** - Handles Web Audio API and audio events
- **`VisualizationRenderer`** - Canvas rendering and animations
- **`StatusManager`** - UI state and feedback management
- **`DOMCache`** - Efficient DOM element caching

## 🎶 Supported Audio

Place your music files in `src/public/` directory. Currently configured for:
- **Cult Member - Faygo.m4a** (test track included)

## 🔧 Technical Details

- Uses `createMediaElementSource()` to connect HTML5 audio to Web Audio API
- `AnalyserNode` with FFT size of 256 for frequency analysis
- Canvas renders 128 frequency bars with HSL color gradients
- Responsive canvas sizing with `window.innerWidth/innerHeight`

---

*Simplified from previous complex ScreenCaptureKit + Tauri approach to clean Web Audio solution.*
