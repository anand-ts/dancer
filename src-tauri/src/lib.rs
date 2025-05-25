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
    // Generate realistic audio data simulation
    let time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as f32 / 1000.0;
    
    let mock_data: Vec<f32> = (0..64)
        .map(|i| {
            let freq = i as f32 / 64.0;
            let bass = if i < 8 { (time * 1.5).sin() * 0.8 + 0.8 } else { 0.2 };
            let mid = if i >= 8 && i < 32 { (time * 2.0 + freq * 10.0).sin() * 0.6 + 0.6 } else { 0.1 };
            let high = if i >= 32 { (time * 4.0 + freq * 20.0).sin() * 0.4 + 0.4 } else { 0.1 };
            
            ((bass + mid + high) * 255.0).max(0.0).min(255.0)
        })
        .collect();
    
    Ok(mock_data)
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
