import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';

interface RecordingWaveformProps {
  /** VAD is listening for speech */
  isListening: boolean;
  /** VAD detected speech - user is speaking */
  isSpeaking: boolean;
  /** VAD is paused (muted) */
  isPaused?: boolean;
  /** MediaStream from the microphone */
  mediaStream: MediaStream | null;
}

export const RecordingWaveform = ({ isListening, isSpeaking, isPaused = false, mediaStream }: RecordingWaveformProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordPluginRef = useRef<ReturnType<typeof RecordPlugin.create> | null>(null);
  const micStreamRef = useRef<{ onDestroy: () => void; onEnd: () => void } | null>(null);

  useEffect(() => {
    if (!isListening || !containerRef.current || !mediaStream) {
      // Cleanup when not listening
      if (micStreamRef.current) {
        micStreamRef.current.onDestroy();
        micStreamRef.current = null;
      }
      if (recordPluginRef.current) {
        recordPluginRef.current = null;
      }
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      return;
    }

    // Clear container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Create Record plugin
    const recordPlugin = RecordPlugin.create({
      renderRecordedAudio: false,
      scrollingWaveform: true,
      scrollingWaveformWindow: 2,
    });

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'hsl(var(--primary))',
      progressColor: 'hsl(var(--primary))',
      cursorWidth: 0,
      height: 32,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      plugins: [recordPlugin],
    });

    wavesurferRef.current = wavesurfer;
    recordPluginRef.current = recordPlugin;

    // Render visualization using the provided mediaStream
    const micStream = recordPlugin.renderMicStream(mediaStream);
    micStreamRef.current = micStream;

    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.onDestroy();
      }
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [isListening, mediaStream]);

  // Pause/resume waveform visualization when muted/unmuted
  useEffect(() => {
    if (!micStreamRef.current || !mediaStream) return;

    // Mute/unmute the audio tracks to stop waveform movement
    mediaStream.getAudioTracks().forEach(track => {
      track.enabled = !isPaused;
    });
  }, [isPaused, mediaStream]);

  if (!isListening) return null;

  const getStatusText = () => {
    if (isPaused) return 'Silenciado';
    if (isSpeaking) return 'Grabando...';
    return 'Escuchando...';
  };

  const getStatusColor = () => {
    if (isPaused) return 'text-destructive';
    if (isSpeaking) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="absolute inset-0 flex items-center bg-background/95 rounded-lg px-3 gap-2">
      <div ref={containerRef} className={`flex-1 h-8 ${isPaused ? 'opacity-30' : ''}`} />
      <span className={`text-xs whitespace-nowrap ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
};
