use std::sync::{Arc, Mutex};
use screencapturekit::sc_shareable_content::SCShareableContent;
use screencapturekit::sc_stream_configuration::SCStreamConfiguration;
use screencapturekit::sc_content_filter::{SCContentFilter, InitParams};
use screencapturekit::sc_output_handler::SCStreamOutputType;
use screencapturekit::sc_stream::SCStream;
use screencapturekit::sc_error_handler::StreamErrorHandler;
use screencapturekit_sys::as_ptr::AsPtr;

use core_audio_types::base_types::AudioBufferList;

#[link(name = "CoreMedia", kind = "framework")]
extern "C" {
    fn CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(
        sbuf: *mut std::ffi::c_void,
        buffer_list_size_needed_out: *mut libc::size_t,
        buffer_list_out: *mut AudioBufferList,
        buffer_list_size: libc::size_t,
        block_buffer_structure_allocator: *const std::ffi::c_void,
        block_buffer_memory_allocator: *const std::ffi::c_void,
        flags: u32,
        block_buffer_out: *mut *mut std::ffi::c_void,
    ) -> i32;
}

struct AppState {
    stream: Option<SCStream>,
    audio_buffer: Arc<Mutex<Vec<f32>>>,
}

impl AppState {
    fn new() -> Self {
        AppState {
            stream: None,
            audio_buffer: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

#[tauri::command]
async fn start_system_audio_capture(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<String, String> {
    let content = SCShareableContent::current();
    let displays = content.displays;
    
    let display = displays.first().ok_or_else(|| "No displays found".to_string())?;
    let filter = SCContentFilter::new(InitParams::Display(display.clone()));
    
    let config = SCStreamConfiguration {
        width: 1,
        height: 1,
        captures_audio: true,
        excludes_current_process_audio: false,
        ..Default::default()
    };

    let mut app_state = state.lock().unwrap();
    
    if app_state.stream.is_some() {
        return Ok("Audio capture already running".to_string());
    }

    let audio_buffer_clone = Arc::clone(&app_state.audio_buffer);

    struct MyStreamOutput {
        audio_buffer: Arc<Mutex<Vec<f32>>>,
    }
    impl screencapturekit::sc_output_handler::StreamOutput for MyStreamOutput {
        fn did_output_sample_buffer(&self, sample_buffer: screencapturekit::cm_sample_buffer::CMSampleBuffer, of_type: SCStreamOutputType) {
            if matches!(of_type, SCStreamOutputType::Audio) {
                match process_cmsamplebuffer(sample_buffer) {
                    Some(audio_data) => {
                        let mut buffer = self.audio_buffer.lock().unwrap();
                        buffer.extend(audio_data);
                        const MAX_SAMPLES: usize = 44100 * 5; 
                        if buffer.len() > MAX_SAMPLES {
                            let overflow = buffer.len() - MAX_SAMPLES;
                            buffer.drain(0..overflow);
                        }
                    }
                    None => {
                        eprintln!("Error processing audio sample buffer");
                    }
                }
            }
        }
    }
    
    let stream_output_handler = MyStreamOutput { audio_buffer: audio_buffer_clone };

    struct MyErrorHandler;
    impl StreamErrorHandler for MyErrorHandler {
        fn on_error(&self) {
            eprintln!("Stream error occurred");
        }
    }

    let mut stream = SCStream::new(filter, config, MyErrorHandler);
    stream.add_output(stream_output_handler, SCStreamOutputType::Audio);
    
    match stream.start_capture() {
        Ok(_) => {
            app_state.stream = Some(stream);
            Ok("System audio capture started".to_string())
        }
        Err(e) => {
            eprintln!("Failed to start capture: {:?}", e);
            Err(format!("Failed to start capture: {:?}", e))
        }
    }
}

#[tauri::command]
async fn stop_system_audio_capture(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<String, String> {
    let mut app_state = state.lock().unwrap();
    if let Some(stream) = app_state.stream.take() {
        match stream.stop_capture() {
            Ok(_) => Ok("System audio capture stopped".to_string()),
            Err(e) => {
                eprintln!("Failed to stop capture: {:?}", e);
                Err(format!("Error stopping capture: {:?}", e))
            }
        }
    } else {
        Ok("No audio capture was running".to_string())
    }
}

#[tauri::command]
async fn get_sck_audio_data(state: tauri::State<'_, Arc<Mutex<AppState>>>) -> Result<Vec<f32>, String> {
    let app_state = state.lock().unwrap();
    let audio_data = app_state.audio_buffer.lock().unwrap().clone();
    if audio_data.is_empty() {
        return Ok(vec![0.0; 64]);
    }
    Ok(audio_data)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = Arc::new(Mutex::new(AppState::new()));

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            start_system_audio_capture,
            stop_system_audio_capture,
            get_sck_audio_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn process_cmsamplebuffer(sample_buffer: screencapturekit::cm_sample_buffer::CMSampleBuffer) -> Option<Vec<f32>> {
    let raw = sample_buffer.sys_ref.as_ptr() as *mut std::ffi::c_void;
    if raw.is_null() { return None; }

    let mut abl = AudioBufferList::default();
    let mut blk_ref: *mut std::ffi::c_void = std::ptr::null_mut();

    let status: i32 = unsafe {
        CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(
            raw,
            std::ptr::null_mut(),
            &mut abl,
            std::mem::size_of::<AudioBufferList>() as libc::size_t,
            std::ptr::null(),
            std::ptr::null(),
            0,
            &mut blk_ref,
        )
    };
    if status != 0 {
        return None;
    }

    let mut all = Vec::new();
    let count = abl.mNumberBuffers as usize;
    let bufs_ptr = abl.mBuffers.as_ptr() as *const core_audio_types::base_types::AudioBuffer;
    for i in 0..count {
        let buf = unsafe { &*bufs_ptr.add(i) };
        if buf.mData.is_null() { continue; }
        let n = buf.mDataByteSize as usize / std::mem::size_of::<f32>();
        let slice = unsafe { std::slice::from_raw_parts(buf.mData as *const f32, n) };
        all.extend_from_slice(slice);
    }

    Some(all)
}
