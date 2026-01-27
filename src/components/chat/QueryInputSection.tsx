import { useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/shadcn/button';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Square, Languages, AudioLines } from 'lucide-react';
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
    selectedAction,
    ttsEnabled,
    onTtsEnabledChange,
  } = useCommand();

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

  useEffect(() => {
    if (selectedAction === 'vectorial') {
      currentMainActionRef.current = onSearchVectorial;
    }
  }, [selectedAction, onSearchVectorial]);

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
                currentMainActionRef.current();
              }
            }}
            className="
              resize-none
              w-full
              text-xs
              leading-normal
              overflow-y-auto
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
          <div>
            {!isLoading && <CommandMenu disabled={isLoading} />}
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
                      onMouseEnter={onPrepareRecording}
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
                      onMouseEnter={onPrepareRecording}
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
