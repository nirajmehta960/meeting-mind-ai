import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
    addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
    addEventListener(type: 'start', listener: () => void): void;
    addEventListener(type: 'end', listener: () => void): void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

export interface UseSpeechRecognitionReturn {
    transcript: string;
    isListening: boolean;
    isSupported: boolean;
    startListening: (initialText?: string) => void;
    stopListening: () => void;
    resetTranscript: () => void;
    error: string | null;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const accumulatedTranscriptRef = useRef('');

    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const startListening = useCallback((initialText: string = '') => {
        if (!isSupported) {
            setError('Speech recognition is not supported in this browser');
            return;
        }

        // Set the initial text as the base for accumulation
        // Add a space if there's existing text
        accumulatedTranscriptRef.current = initialText ? initialText + ' ' : '';
        setTranscript(accumulatedTranscriptRef.current);

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.addEventListener('start', () => {
                setIsListening(true);
                setError(null);
            });

            recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript;
                    } else {
                        interimTranscript += result[0].transcript;
                    }
                }

                // Accumulate final results and preserve them
                if (finalTranscript) {
                    accumulatedTranscriptRef.current += finalTranscript;
                }

                // Combine accumulated final transcript with current interim results
                const fullTranscript = accumulatedTranscriptRef.current + interimTranscript;
                setTranscript(fullTranscript);
            });

            recognition.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
                setError(`Speech recognition error: ${event.error}`);
                setIsListening(false);
            });

            recognition.addEventListener('end', () => {
                setIsListening(false);
            });

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            setError('Failed to start speech recognition');
            setIsListening(false);
        }
    }, [isSupported]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        accumulatedTranscriptRef.current = '';
        setError(null);
    }, []);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    return {
        transcript,
        isListening,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
        error,
    };
};