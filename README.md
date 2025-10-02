

# Dancer

<p align="center">
  <img src="public/dancer_new.gif" alt="Dancer">
</p>

## Project SummaryDancer is a standalone music visualizer that transforms audio into real-time visual experiences. Built as a hybrid desktop application using Tauri and modern web technologies, it provides waveform visualizations with interactive controls.

## Key Features

- **Drag & Drop Support** - Drop audio files onto the interface
- **Real-time Visualization** - Waveform rendering with Web Audio API
- **Multiple Audio Formats** - Support for MP3, WAV, M4A, FLAC
- **Interactive Controls** - Audio player with seekable timeline
- **Draggable Interface** - Moveable control panels
- **Native Performance** - Cross-platform desktop application

## Tech Stack

- JavaScript
- HTML / CSS
- Canvas API
- Web Audio API
- Vite
- Tauri
- Rust

## Usage

### **Getting Started**

1. **Clone the repository**
   ```bash
   git clone https://github.com/anand-ts/dancer.git
   cd dancer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```
   
   For Tauri development with hot reload:
   ```bash
   npm run tauri dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm run tauri build
   ```

### **Inspiration**

- Windows Media Player (XP & later) 
- iTunes Visualizer**  
  Apple's "wormhole" and particle effects-later powered by the Magnetosphere plugin-offered smooth, psychedelic animations.
- PSP / PS3 Music Visualizer