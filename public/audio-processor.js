class PCMAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Buffer to accumulate samples before sending (target ~4096 samples like old implementation)
    this.buffer = [];
    this.bufferSize = 4096;

    // Listen for flush commands from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'flush') {
        // Send any remaining buffered audio immediately
        if (this.buffer.length > 0) {
          this.sendBuffer();
        }
      }
    };
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
          this.sendBuffer();
        }
      }
    }

    // Return true to keep processor alive
    return true;
  }

  sendBuffer() {
    if (this.buffer.length === 0) return;

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

    // Clear buffer
    this.buffer = [];
  }
}

registerProcessor('pcm-audio-processor', PCMAudioProcessor);
