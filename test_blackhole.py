#!/usr/bin/env python3
"""
Test script to verify BlackHole virtual audio driver setup
"""

import subprocess
import json

def list_audio_devices():
    """List all audio input devices using system_profiler"""
    try:
        # Get audio hardware info
        result = subprocess.run([
            'system_profiler', 'SPAudioDataType', '-json'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            print("=== Audio Devices Found ===")
            
            # Look for audio devices in the JSON structure
            for item in data.get('SPAudioDataType', []):
                for key, value in item.items():
                    if isinstance(value, list):
                        for device in value:
                            if isinstance(device, dict):
                                name = device.get('_name', 'Unknown')
                                manufacturer = device.get('coreaudio_device_manufacturer', 'Unknown')
                                print(f"Device: {name} (Manufacturer: {manufacturer})")
        else:
            print("Failed to get audio device info")
            
    except Exception as e:
        print(f"Error listing devices: {e}")

def check_blackhole():
    """Check if BlackHole is installed and configured"""
    try:
        # Check if BlackHole is available as input device
        result = subprocess.run([
            'osascript', '-e', 
            'tell application "System Events" to get name of every audio device'
        ], capture_output=True, text=True)
        
        print("\n=== BlackHole Status ===")
        
        if 'BlackHole' in result.stdout:
            print("✅ BlackHole detected in system")
        else:
            print("❌ BlackHole not found")
            print("Install with: brew install blackhole-2ch")
            
    except Exception as e:
        print(f"Error checking BlackHole: {e}")

def check_multi_output_device():
    """Instructions for setting up multi-output device"""
    print("\n=== Multi-Output Device Setup ===")
    print("To route app audio to BlackHole:")
    print("1. Open Audio MIDI Setup (Applications > Utilities)")
    print("2. Click '+' and create 'Multi-Output Device'")
    print("3. Check both your speakers/headphones AND BlackHole 2ch")
    print("4. Set this Multi-Output Device as your system output")
    print("5. In Dancer app, select 'BlackHole 2ch' as input device")
    print("6. Play music in Spotify/Apple Music to test")

if __name__ == "__main__":
    print("BlackHole Audio Setup Test")
    print("=" * 30)
    
    list_audio_devices()
    check_blackhole()
    check_multi_output_device()
