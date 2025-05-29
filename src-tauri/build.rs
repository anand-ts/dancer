fn main() {
    println!("cargo:rustc-link-lib=framework=ScreenCaptureKit");
    tauri_build::build()
}
