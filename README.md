# Dancer: Audio Visualizer Desktop App
> This project is a W.I.P

<p align="center">
  <img src="public/dancer.gif" alt="Dancer Visualizer Demo" width="500" />
  <br/>
  <em style="font-size:1.1em; color:#4caf50;">Theme shown: Matrix (Green Wireframe Sphere)</em>
</p>

**Dancer** is a macOS desktop audio visualizer built with Tauri, Vite, Three.js, and Swift using [ScreenCaptureKit](https://developer.apple.com/documentation/screencapturekit/). It features real-time 3D visualizations that react to your system's audio.

## Tech Stack

- Rust (Tauri)
- C (FFI bridge for Swift-Rust interoperability)
- Swift (macOS audio and screen capture via [ScreenCaptureKit](https://developer.apple.com/documentation/screencapturekit/))
- Three.js (3D WebGL visualizations)
- macOS support

## Usage
Run `npm run dev` for frontend development, and `npm run tauri dev` to launch the desktop app.

---
Spring 2025
