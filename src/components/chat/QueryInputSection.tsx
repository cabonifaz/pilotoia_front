import { useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/shadcn/button';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Square, Languages, AudioLines, Paperclip, X } from 'lucide-react';
import { VoiceRecordButton } from './VoiceRecordButton';
import { FileTranscribeButton } from './FileTranscribeButton';
import { ContinuousVoiceButton } from './ContinuousVoiceButton';
import { ContinuousFileTranscribeButton } from './ContinuousFileTranscribeButton';
import { CommandMenu } from './CommandMenu';
import { RecordingWaveform } from './RecordingWaveform';
import { useCommand } from '../../contexts/CommandContext';
import { useTranscription } from '../../contexts/TranscriptionContext';
import {
  getAvailableLanguages,
  getLanguageCode,
} from '../../constants/languages';

interface QueryInputSectionProps {
  company: string;
  area: string;
}

export const QueryInputSection = ({ company, area }: QueryInputSectionProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentMainActionRef = useRef<() => void>(() => {});

  const {
    userQuery,
    onQueryChange,
    isLoading,
    onCancel,
    onSearchVectorial,
    onAnalyzeImages,
    selectedAction,
    vlmMode,
    ttsEnabled,
    onTtsEnabledChange,
    ocrImages,
    onOcrImagesChange,
  } = useCommand();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const unique = files.filter(
      (f) => !ocrImages.some((existing) => existing.name === f.name && existing.size === f.size)
    );
    const merged = [...ocrImages, ...unique].slice(0, 5);
    onOcrImagesChange(merged);
    e.target.value = '';
  }, [ocrImages, onOcrImagesChange]);

  const removeOcrImage = useCallback((index: number) => {
    onOcrImagesChange(ocrImages.filter((_, i) => i !== index));
  }, [ocrImages, onOcrImagesChange]);

  const {
    transcribeProvider,
    selectedLanguage,
    setSelectedLanguage,
    isRecording,
    isConnecting,
    onMicrophoneClick,
    isFileRecording,
    isFileSpeaking,
    isFileTranscribing,
    fileMediaStream,
    onPrepareRecording,
    onStartRecording,
    onStopRecording,
    isContinuousRecording,
    isContinuousConnecting,
    onContinuousVoiceClick,
    isContinuousFileRecording,
    isContinuousFileSpeaking,
    isContinuousFileTranscribing,
    onContinuousFileClick,
    isMuted,
    onMuteToggle,
  } = useTranscription();

  /* ---------------- TEXTAREA AUTO-RESIZE ---------------- */

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';

    const maxHeight = 56; // ~3 rows
    const nextHeight = Math.min(el.scrollHeight, maxHeight);

    el.style.height = `${nextHeight}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onQueryChange(e.target.value);
    resizeTextarea();
  };

  useEffect(() => {
    resizeTextarea();
  }, [userQuery]);

  const VLM_PREFILLS: Partial<Record<typeof vlmMode, string>> = {
    vlm_extract_fields: 'Extrae los campos del archivo',
    vlm_summarize_doc: 'Resume la información del archivo',
    vlm_ocr_clean: 'Extrae la información de este archivo',
  };

  useEffect(() => {
    if (selectedAction === 'ocr' && !userQuery && vlmMode in VLM_PREFILLS) {
      onQueryChange(VLM_PREFILLS[vlmMode]!);
    }
  }, [userQuery]);

  useEffect(() => {
    if (selectedAction === 'vectorial') {
      currentMainActionRef.current = onSearchVectorial;
    } else if (selectedAction === 'ocr') {
      currentMainActionRef.current = onAnalyzeImages;
    }
  }, [selectedAction, onSearchVectorial, onAnalyzeImages]);

  /* ---------------- LANGUAGES ---------------- */

  const availableLanguages = useMemo(() => {
    const provider = transcribeProvider === 'aws' ? 'aws' : 'openai';
    return getAvailableLanguages(provider);
  }, [transcribeProvider]);

  /* ---------------- UI ---------------- */

  return (
    <div className="p-1">
      <div className="flex flex-col border border-muted-foreground/30 rounded-3xl px-1 pt-2 pb-1">
        {/* TEXTAREA - top */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={userQuery}
            onChange={handleChange}
            placeholder={`Escribe tu consulta sobre ${company} • ${area}`}
            disabled={isLoading}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (selectedAction === 'ocr' && (ocrImages.length === 0 || !userQuery.trim())) return;
                currentMainActionRef.current();
              }
            }}
            className="
              resize-none
              w-full
              text-xs
              leading-normal
              overflow-y-auto
              chat-scroll
              border-0
              focus-visible:ring-0
              focus-visible:ring-offset-0
              px-3
              py-1
              min-h-[1.5rem]
              max-h-[3.5rem]
            "
          />
          <RecordingWaveform
            isListening={isFileRecording || isContinuousFileRecording}
            isSpeaking={isFileSpeaking || isContinuousFileSpeaking}
            isPaused={isMuted}
            mediaStream={fileMediaStream}
          />
        </div>

        {/* CONTROLS ROW - bottom */}
        <div className="flex items-center justify-between pt-1">
          {/* LEFT */}
          <div className="flex items-center gap-1">
            {!isLoading && <CommandMenu disabled={isLoading} />}
            {!isLoading && selectedAction === 'ocr' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.bmp,image/png,image/jpeg,image/webp,image/bmp"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ocrImages.length >= 5}
                  title={ocrImages.length >= 5 ? 'Máximo 5 imágenes' : 'Adjuntar imágenes'}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                {ocrImages.map((file, i) => (
                  <div key={i} className="relative flex items-center">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-7 w-7 rounded object-cover border border-muted-foreground/30"
                    />
                    <button
                      className="absolute -top-1 -right-1 bg-background rounded-full border border-muted-foreground/30 p-px"
                      onClick={() => removeOcrImage(i)}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1">
            {isLoading ? (
              <Button
                onClick={onCancel}
                variant="destructive"
                size="icon"
                className="rounded-full"
              >
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Select
                  value={selectedLanguage}
                  onValueChange={setSelectedLanguage}
                >
                  <SelectTrigger className="h-8 w-[100px] text-xs border-muted-foreground/30">
                    <Languages className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableLanguages.map((lang) => {
                      const provider =
                        transcribeProvider === 'aws' ? 'aws' : 'openai';
                      const code = getLanguageCode(lang, provider);
                      if (!code) return null;

                      return (
                        <SelectItem
                          key={code}
                          value={code}
                          className="text-xs"
                        >
                          {lang.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {transcribeProvider === 'aws' ? (
                  <>
                    <VoiceRecordButton
                      isRecording={isRecording}
                      isConnecting={isConnecting}
                      isDisabled={isLoading}
                      onClick={() => {
                        onMicrophoneClick();
                        textareaRef.current?.focus();
                      }}
                      isMuteMode={isContinuousRecording}
                      isMuted={isMuted}
                      onMuteToggle={() => {
                        onMuteToggle();
                        textareaRef.current?.focus();
                      }}
                    />
                    <ContinuousVoiceButton
                      isRecording={isContinuousRecording}
                      isConnecting={isContinuousConnecting}
                      isDisabled={isLoading || isRecording}
                      onClick={() => {
                        onContinuousVoiceClick();
                        textareaRef.current?.focus();
                      }}
                    />
                  </>
                ) : (
                  <>
                    <FileTranscribeButton
                      isRecording={isFileRecording}
                      isTranscribing={isFileTranscribing}
                      isDisabled={isLoading}
                      onMouseDown={onPrepareRecording}
                      onClick={() => {
                        isFileRecording
                          ? onStopRecording()
                          : onStartRecording();
                        textareaRef.current?.focus();
                      }}
                      isMuteMode={isContinuousFileRecording}
                      isMuted={isMuted}
                      onMuteToggle={() => {
                        onMuteToggle();
                        textareaRef.current?.focus();
                      }}
                    />
                    <ContinuousFileTranscribeButton
                      isRecording={isContinuousFileRecording}
                      isTranscribing={isContinuousFileTranscribing}
                      isDisabled={isLoading || isFileRecording}
                      onMouseDown={onPrepareRecording}
                      onClick={() => {
                        onContinuousFileClick();
                        textareaRef.current?.focus();
                      }}
                    />
                  </>
                )}

                <Button
                  onClick={() => {
                    onTtsEnabledChange(!ttsEnabled);
                    textareaRef.current?.focus();
                  }}
                  variant="ghost"
                  size="icon"
                  className={`rounded-full ${
                    ttsEnabled
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : ''
                  }`}
                >
                  <AudioLines className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
