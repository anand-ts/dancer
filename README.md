

# Dancer - Music Visualizer

![dancer](/public/dancer_new.gif)

## Project Summary

Dancer is a music visualizer that transforms audio into real-time visual experiences. Built with Tauri and web technologies, it provides waveform visualizations with interactive controls.

## Key Features

- **Drag & Drop Support** - Drop audio files onto the interface
- **Real-time Visualization** - Waveform rendering with Web Audio API
- **Multiple Audio Formats** - Support for MP3, WAV, M4A, FLAC
- **Interactive Controls** - Audio player with seekable timeline
- **Draggable Interface** - Moveable control panels
- **Native Performance** - Tauri desktop application
- **Responsive UI** - Responsive design with animations

## Tech Stack

### **Backend**
- **Tauri (Rust)** - Desktop application framework
- **ScreenCaptureKit** - macOS screen capture
- **Web Audio API** - Audio processing

### **Frontend**
- **HTML / CSS / JavaScript** - Web technologies
- **Vite** - Build tool and development server
- **Canvas API** - Rendering

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

### **How to Use**

1. **Load Audio** - Drag and drop an audio file or use the file picker
2. **Control Playback** - Use the audio controls to play, pause, and seek
3. **Customize View** - Drag the control panel to preferred position
4. **Enjoy** - Watch the waveform visualization sync with your music