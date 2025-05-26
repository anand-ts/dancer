use tauri::Window;

#[tauri::command]
async fn start_audio_capture(_window: Window) -> Result<String, String> {
    println!("Audio capture requested - using demo mode");
    Ok("Demo audio mode started".to_string())
}

#[tauri::command]
async fn stop_audio_capture() -> Result<String, String> {
    println!("Audio capture stopped");
    Ok("Audio capture stopped".to_string())
}

#[tauri::command]
async fn get_audio_data() -> Result<Vec<f32>, String> {
    // Return silence when no real audio capture is implemented
    // This prevents fake audio detection when nothing is playing
    let silent_data: Vec<f32> = vec![0.0; 64];
    
    Ok(silent_data)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            start_audio_capture,
            stop_audio_capture,
            get_audio_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
