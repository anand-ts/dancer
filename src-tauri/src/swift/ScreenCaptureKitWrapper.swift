import Foundation
import CoreMedia
import AVFoundation

// Only import ScreenCaptureKit if available (macOS 12.3+)
#if canImport(ScreenCaptureKit)
import ScreenCaptureKit

// C-compatible struct for audio data
@frozen
public struct AudioData {
    public let samples: UnsafeMutablePointer<Float>
    public let count: UInt32
    public let sampleRate: Double
    public let channels: UInt32
}

// C-compatible callback type - use unsafe raw pointer instead
public typealias AudioCallback = @convention(c) (UnsafeMutablePointer<Float>, UInt32, Double, UInt32) -> Void

@MainActor
@available(macOS 12.3, *)
@objc public class ScreenCaptureKitManager: NSObject {
    private var stream: SCStream?
    private var audioCallback: AudioCallback? // Accessed only on MainActor
    private var isCapturing = false          // Accessed only on MainActor
    private let captureQueue = DispatchQueue(label: "com.dancer.screencapture", qos: .userInteractive)

    @objc public static let shared = ScreenCaptureKitManager()

    private override init() {
        super.init()
    }

    @objc public func startSystemAudioCapture(_ callback: @escaping AudioCallback) -> Bool {
        guard !isCapturing else {
            print("Audio capture already running")
            return false
        }
        self.audioCallback = callback

        Task {
            await startCaptureInternal()
        }
        return true
    }

    private func startCaptureInternal() async {
        do {
            let content = try await SCShareableContent.current
            guard let display = content.displays.first else {
                print("No displays found")
                return
            }
            let filter = SCContentFilter(display: display, excludingWindows: [])
            let configuration = SCStreamConfiguration()
            configuration.capturesAudio = true
            configuration.excludesCurrentProcessAudio = true
            configuration.sampleRate = 44100
            configuration.channelCount = 2
            configuration.width = 1
            configuration.height = 1
            configuration.minimumFrameInterval = CMTime(value: 1, timescale: 1)

            let newStream = SCStream(filter: filter, configuration: configuration, delegate: self)
            try newStream.addStreamOutput(self, type: .audio, sampleHandlerQueue: captureQueue)
            try await newStream.startCapture()

            self.stream = newStream
            self.isCapturing = true
            print("System audio capture started successfully")
        } catch {
            print("Failed to start audio capture: \(error)")
            self.isCapturing = false
            self.audioCallback = nil // Clear callback on failure
        }
    }

    @objc public func stopSystemAudioCapture() -> Bool {
        guard isCapturing, let streamToStop = stream else {
            print("No audio capture running")
            return false
        }

        Task {
            do {
                try await streamToStop.stopCapture()
                self.stream = nil
                self.isCapturing = false
                self.audioCallback = nil
                print("System audio capture stopped")
            } catch {
                print("Error stopping capture: \(error)")
                self.isCapturing = false
                self.audioCallback = nil // Ensure callback is cleared on error
            }
        }
        return true
    }

    @objc public func isCurrentlyCapturing() -> Bool {
        return isCapturing
    }
}

@available(macOS 12.3, *)
extension ScreenCaptureKitManager: SCStreamDelegate {
    nonisolated public func stream(_ stream: SCStream, didStopWithError error: Error) {
        print("Stream stopped with error: \(error.localizedDescription)")
        Task { @MainActor in
            ScreenCaptureKitManager.shared.isCapturing = false
            ScreenCaptureKitManager.shared.audioCallback = nil
        }
    }
}

@available(macOS 12.3, *)
extension ScreenCaptureKitManager: SCStreamOutput {
    nonisolated public func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .audio else { return }

        Task { @MainActor in
            guard let callback = ScreenCaptureKitManager.shared.audioCallback else { return }
            
            guard CMSampleBufferGetNumSamples(sampleBuffer) > 0 else { return }
            
            var audioBufferList = AudioBufferList()
            var blockBuffer: CMBlockBuffer?
            
            let status = CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(
                sampleBuffer,
                bufferListSizeNeededOut: nil,
                bufferListOut: &audioBufferList,
                bufferListSize: MemoryLayout<AudioBufferList>.size,
                blockBufferAllocator: nil,
                blockBufferMemoryAllocator: nil,
                flags: 0,
                blockBufferOut: &blockBuffer
            )
            
            guard status == noErr else {
                print("Failed to get audio buffer list: \(status)")
                return
            }
            
            let ablPointer = UnsafeMutableAudioBufferListPointer(&audioBufferList)

            for buffer in ablPointer {
                guard let mData = buffer.mData?.assumingMemoryBound(to: Float.self) else { continue }
                let frameCount = buffer.mDataByteSize / UInt32(MemoryLayout<Float>.size)
                let actualChannelCount = buffer.mNumberChannels
                
                if frameCount > 0 {
                    callback(mData, frameCount, 44100.0, actualChannelCount)
                }
            }
        }
    }
}

// C-compatible interface functions
@_cdecl("sck_start_audio_capture")
public func sck_start_audio_capture(callback: @escaping AudioCallback) -> Bool {
    var result = false
    let semaphore = DispatchSemaphore(value: 0)
    Task { @MainActor in
        result = ScreenCaptureKitManager.shared.startSystemAudioCapture(callback)
        semaphore.signal()
    }
    semaphore.wait()
    return result
}

@_cdecl("sck_stop_audio_capture")
public func sck_stop_audio_capture() -> Bool {
    var result = false
    let semaphore = DispatchSemaphore(value: 0)
    Task { @MainActor in
        result = ScreenCaptureKitManager.shared.stopSystemAudioCapture()
        semaphore.signal()
    }
    semaphore.wait()
    return result
}

@_cdecl("sck_is_capturing")
public func sck_is_capturing() -> Bool {
    var result = false
    let semaphore = DispatchSemaphore(value: 0)
    Task { @MainActor in
        result = ScreenCaptureKitManager.shared.isCurrentlyCapturing()
        semaphore.signal()
    }
    semaphore.wait()
    return result
}
#endif // canImport(ScreenCaptureKit)
