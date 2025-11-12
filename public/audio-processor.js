class PCMAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Bootstrap buffer: smaller initial buffer for fast first audio send (~12ms)
    // Normal buffer: larger for subsequent sends (~50ms)
    this.buffer = [];
    this.normalBufferSize = 800; // At 16kHz: ~50ms
    this.bufferSize = 200; // Initial: ~12ms for fast bootstrap
    this.isBootstrapped = false;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const inputData = input[0]; // Get first channel (mono)

      if (inputData && inputData.length > 0) {
        // Add samples to buffer
        this.buffer.push(...inputData);

        // Send when we have enough samples
        if (this.buffer.length >= this.bufferSize) {
          // Convert accumulated Float32Array to Int16Array PCM (little-endian)
          const pcmData = new Int16Array(this.buffer.length);
          for (let i = 0; i < this.buffer.length; i++) {
            const s = Math.max(-1, Math.min(1, this.buffer[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // Send PCM data to main thread
          this.port.postMessage({
            type: 'audio',
            data: pcmData.buffer
          }, [pcmData.buffer]); // Transfer buffer for performance

          // After first send, switch to normal buffer size for efficiency
          if (!this.isBootstrapped) {
            this.isBootstrapped = true;
            this.bufferSize = this.normalBufferSize;
          }

          // Clear buffer
          this.buffer = [];
        }
      }
    }

    // Return true to keep processor alive
    return true;
  }
}

registerProcessor('pcm-audio-processor', PCMAudioProcessor);
