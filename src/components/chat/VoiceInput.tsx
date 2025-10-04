import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceInputProps {
  onResult: (transcript: string) => void;
  onRecordingChange: (recording: boolean) => void;
  disabled?: boolean;
}

export function VoiceInput({ onResult, onRecordingChange, disabled = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startRecording = async () => {
    if (!isSupported || disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setAudioLevel(average / 255); // Normalize to 0-1
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      // Set up speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        stopRecording();
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Voice recognition failed. Please try again.');
        stopRecording();
      };

      recognition.onend = () => {
        stopRecording();
      };

      recognition.start();
      setIsRecording(true);
      onRecordingChange(true);
      updateAudioLevel();

      // Store recognition instance for cleanup
      mediaRecorderRef.current = recognition as any;

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      try {
        (mediaRecorderRef.current as any).stop();
      } catch (e) {
        // Recognition might already be stopped
      }
      mediaRecorderRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsRecording(false);
    onRecordingChange(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  if (!isSupported) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="h-10 w-10 p-0 opacity-50"
        title="Voice input not supported in this browser"
      >
        <MicOff className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      className={cn(
        "h-10 w-10 p-0 relative transition-all duration-300",
        isRecording 
          ? "bg-destructive/10 hover:bg-destructive/20 text-destructive scale-110" 
          : "hover:bg-primary/10 hover:text-primary"
      )}
    >
      {isRecording ? (
        <>
          <MicOff className="w-4 h-4" />
          {/* Audio Visualization */}
          <div className="absolute inset-0 rounded-md overflow-hidden">
            <div 
              className="absolute bottom-0 left-0 right-0 bg-destructive/30 transition-all duration-100"
              style={{ height: `${audioLevel * 100}%` }}
            />
          </div>
          {/* Recording indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}