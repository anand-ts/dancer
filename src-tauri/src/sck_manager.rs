use std::os::raw::c_void;
use std::sync::{Arc, Mutex, mpsc};
use std::slice;

// C-compatible struct matching Swift definition
#[repr(C)]
pub struct AudioData {
    pub samples: *mut f32,
    pub count: u32,
    pub sample_rate: f64,
    pub channels: u32,
}

// C callback type
pub type AudioCallback = extern "C" fn(AudioData);

// External Swift functions
extern "C" {
    fn sck_start_audio_capture(callback: AudioCallback) -> bool;
    fn sck_stop_audio_capture() -> bool;
    fn sck_is_capturing() -> bool;
}

// Global audio buffer to store captured audio
static AUDIO_BUFFER: Mutex<Vec<f32>> = Mutex::new(Vec::new());

// Global channel for sending audio data to Rust
static mut AUDIO_SENDER: Option<Arc<Mutex<mpsc::Sender<Vec<f32>>>>> = None;

// Audio callback function called from Swift
extern "C" fn audio_callback(audio_data: AudioData) {
    unsafe {
        if audio_data.samples.is_null() || audio_data.count == 0 {
            return;
        }
        
        // Convert raw audio data to Vec<f32>
        let samples = slice::from_raw_parts(audio_data.samples, audio_data.count as usize);
        let audio_vec = samples.to_vec();
        
        // Store in global buffer
        if let Ok(mut buffer) = AUDIO_BUFFER.lock() {
            buffer.extend_from_slice(&audio_vec);
            
            // Keep buffer size manageable (5 seconds at 44.1kHz)
            const MAX_SAMPLES: usize = 44100 * 5;
            if buffer.len() > MAX_SAMPLES {
                let overflow = buffer.len() - MAX_SAMPLES;
                buffer.drain(0..overflow);
            }
        }
        
        // Also send to any active receiver
        if let Some(sender) = &AUDIO_SENDER {
            if let Ok(sender) = sender.lock() {
                let _ = sender.send(audio_vec);
            }
        }
    }
}

pub struct ScreenCaptureKitManager {
    _receiver: Option<mpsc::Receiver<Vec<f32>>>,
}

impl ScreenCaptureKitManager {
    pub fn new() -> Self {
        Self {
            _receiver: None,
        }
    }
    
    pub fn start_system_audio_capture(&mut self) -> Result<(), String> {
        unsafe {
            let success = sck_start_audio_capture(audio_callback);
            if success {
                Ok(())
            } else {
                Err("Failed to start system audio capture".to_string())
            }
        }
    }
    
    pub fn stop_system_audio_capture(&self) -> Result<(), String> {
        unsafe {
            let success = sck_stop_audio_capture();
            if success {
                Ok(())
            } else {
                Err("Failed to stop system audio capture".to_string())
            }
        }
    }
    
    pub fn is_capturing(&self) -> bool {
        unsafe {
            sck_is_capturing()
        }
    }
    
    pub fn get_audio_data(&self) -> Vec<f32> {
        if let Ok(buffer) = AUDIO_BUFFER.lock() {
            buffer.clone()
        } else {
            Vec::new()
        }
    }
    
    pub fn clear_audio_buffer(&self) {
        if let Ok(mut buffer) = AUDIO_BUFFER.lock() {
            buffer.clear();
        }
    }
}
