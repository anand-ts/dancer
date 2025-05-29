#ifndef ScreenCaptureKit_Bridging_Header_h
#define ScreenCaptureKit_Bridging_Header_h

#include <stdint.h>
#include <stdbool.h>

// C-compatible struct for audio data
typedef struct {
    float* samples;
    uint32_t count;
    double sampleRate;
    uint32_t channels;
} AudioData;

// C-compatible callback type
typedef void (*AudioCallback)(AudioData audioData);

// C interface functions
bool sck_start_audio_capture(AudioCallback callback);
bool sck_stop_audio_capture(void);
bool sck_is_capturing(void);

#endif /* ScreenCaptureKit_Bridging_Header_h */
