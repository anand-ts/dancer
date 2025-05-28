use std::sync::Mutex;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tauri::Window;
use once_cell::sync::Lazy;
use std::thread;
use std::sync::mpsc;

// Shared buffer for audio samples
static AUDIO_BUFFER: Lazy<Mutex<Vec<f32>>> = Lazy::new(|| Mutex::new(vec![0.0; 2048]));
// Channel to stop audio capture
static STOP_SENDER: Lazy<Mutex<Option<mpsc::Sender<()>>>> = Lazy::new(|| Mutex::new(None));

#[tauri::command]
async fn list_audio_input_devices() -> Result<Vec<String>, String> {
    let host = cpal::default_host();
    let devices = host.input_devices().map_err(|e| e.to_string())?;
    let names = devices
        .filter_map(|d| d.name().ok())
        .collect();
    Ok(names)
}

#[tauri::command]
async fn start_audio_capture_with_device(device_name: String) -> Result<String, String> {
    // Stop any existing capture first
    {
        let mut stop_guard = STOP_SENDER.lock().unwrap();
        if let Some(sender) = stop_guard.take() {
            let _ = sender.send(()); // Signal the thread to stop
        }
    }

    let host = cpal::default_host();
    let device = host.input_devices()
        .map_err(|e| e.to_string())?
        .find(|d| d.name().map(|n| n == device_name).unwrap_or(false))
        .ok_or("Device not found")?;
    
    let config = device.default_input_config().map_err(|e| e.to_string())?;
    println!("Audio config: {:?}", config);

    // Clear the buffer
    {
        let mut buf = AUDIO_BUFFER.lock().unwrap();
        buf.fill(0.0);
    }

    // Create a channel for stopping the audio capture
    let (stop_tx, stop_rx) = mpsc::channel();
    
    // Store the stop sender
    {
        let mut stop_guard = STOP_SENDER.lock().unwrap();
        *stop_guard = Some(stop_tx);
    }

    // Spawn a thread to handle audio capture
    let device_name_clone = device_name.clone();
    thread::spawn(move || {
        let err_fn = |err| eprintln!("Stream error: {}", err);
        
        let stream_result = match config.sample_format() {
            cpal::SampleFormat::F32 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[f32], _| {
                        let mut buf = AUDIO_BUFFER.lock().unwrap();
                        let copy_len = data.len().min(buf.len());
                        buf[..copy_len].copy_from_slice(&data[..copy_len]);
                        
                        // Calculate RMS for debugging
                        let rms: f32 = data.iter().map(|&x| x * x).sum::<f32>() / data.len() as f32;
                        let rms = rms.sqrt();
                        if rms > 0.001 { // Only print if there's significant audio
                            println!("Audio RMS: {:.4}", rms);
                        }
                    },
                    err_fn,
                    None,
                )
            },
            cpal::SampleFormat::I16 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[i16], _| {
                        let mut buf = AUDIO_BUFFER.lock().unwrap();
                        let copy_len = data.len().min(buf.len());
                        for i in 0..copy_len {
                            buf[i] = data[i] as f32 / i16::MAX as f32;
                        }
                        
                        // Calculate RMS for debugging
                        let rms: f32 = data.iter().map(|&x| (x as f32 / i16::MAX as f32).powi(2)).sum::<f32>() / data.len() as f32;
                        let rms = rms.sqrt();
                        if rms > 0.001 {
                            println!("Audio RMS: {:.4}", rms);
                        }
                    },
                    err_fn,
                    None,
                )
            },
            cpal::SampleFormat::U16 => {
                device.build_input_stream(
                    &config.into(),
                    move |data: &[u16], _| {
                        let mut buf = AUDIO_BUFFER.lock().unwrap();
                        let copy_len = data.len().min(buf.len());
                        for i in 0..copy_len {
                            buf[i] = (data[i] as f32 / u16::MAX as f32) * 2.0 - 1.0; // Convert to signed
                        }
                        
                        // Calculate RMS for debugging
                        let rms: f32 = data.iter().map(|&x| ((x as f32 / u16::MAX as f32) * 2.0 - 1.0).powi(2)).sum::<f32>() / data.len() as f32;
                        let rms = rms.sqrt();
                        if rms > 0.001 {
                            println!("Audio RMS: {:.4}", rms);
                        }
                    },
                    err_fn,
                    None,
                )
            },
            _ => {
                eprintln!("Unsupported sample format");
                return;
            }
        };
        
        match stream_result {
            Ok(stream) => {
                if let Err(e) = stream.play() {
                    eprintln!("Failed to play stream: {}", e);
                    return;
                }
                
                println!("Audio capture started for device: {}", device_name_clone);
                
                // Keep the stream alive until we receive a stop signal
                match stop_rx.recv() {
                    Ok(_) => println!("Audio capture stopped for device: {}", device_name_clone),
                    Err(_) => println!("Audio capture channel closed for device: {}", device_name_clone),
                }
            },
            Err(e) => {
                eprintln!("Failed to build input stream: {}", e);
            }
        }
    });

    Ok(format!("Audio capture starting for device: {}", device_name))
}

#[tauri::command]
async fn start_audio_capture(_window: Window) -> Result<String, String> {
    println!("Audio capture requested - using demo mode");
    Ok("Demo audio mode started".to_string())
}

#[tauri::command]
async fn stop_audio_capture() -> Result<String, String> {
    let mut stop_guard = STOP_SENDER.lock().unwrap();
    if let Some(sender) = stop_guard.take() {
        match sender.send(()) {
            Ok(_) => {
                println!("Audio capture stop signal sent");
                Ok("Audio capture stopped".to_string())
            },
            Err(_) => Ok("Audio capture was already stopped".to_string())
        }
    } else {
        Ok("No audio capture was running".to_string())
    }
}

#[tauri::command]
async fn get_audio_data() -> Result<Vec<f32>, String> {
    // Return the latest audio buffer (downsampled to 64 samples for visualization)
    let mut out = vec![0.0; 64];
    let buf = AUDIO_BUFFER.lock().unwrap();
    
    if buf.len() >= 64 {
        let step = buf.len() / out.len();
        for (i, o) in out.iter_mut().enumerate() {
            *o = buf[i * step].abs(); // Use absolute value for visualization
        }
    }
    
    Ok(out)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            start_audio_capture,
            stop_audio_capture,
            get_audio_data,
            list_audio_input_devices,
            start_audio_capture_with_device
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
