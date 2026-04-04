import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Loader2, Phone, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';

const VoiceNavigator = () => {
    const [isAutoMode, setIsAutoMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcriptText, setTranscriptText] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [isSupported, setIsSupported] = useState(false);

    const navigate = useNavigate();
    const { language } = useLanguage();
    const recognitionRef = useRef(null);

    // Check browser support on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);
        
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported in this browser");
        }
    }, []);

    // Effect for Auto-Mode continuous listening
    useEffect(() => {
        if (isAutoMode && isSupported && !isListening && !isProcessing) {
            const timer = setTimeout(() => {
                startListening(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAutoMode, isListening, isProcessing, isSupported]);

    const handleVoiceCommand = async (text) => {
        const rawText = text.toLowerCase().trim();
        if (!rawText) return;

        // Wake word detection: "Hey Sankat Saathi" or "Hey SankatSaathi"
        const wakeWord = "sankat saathi";
        const hasWakeWord = rawText.includes(wakeWord) || rawText.includes("sankatsaathi");
        
        let commandToProcess = rawText;
        if (hasWakeWord) {
            // Extract the command after the wake word
            const parts = rawText.split(wakeWord);
            commandToProcess = parts[parts.length - 1].trim();
            // If empty, it was just the wake word
            if (!commandToProcess) {
                const greetUtterance = new SpeechSynthesisUtterance("I am listening. How can I help?");
                greetUtterance.lang = 'en-US';
                window.speechSynthesis.speak(greetUtterance);
                return;
            }
        } else if (isAutoMode) {
            // In auto-mode, we only react to the wake word to avoid false positives
            return;
        }

        setIsListening(false);
        setIsProcessing(true);
        setTranscriptText(`Autonomous Processing: "${commandToProcess}"`);

        try {
            console.log("Processing voice command:", commandToProcess);
            
            const apiUrl = import.meta.env.VITE_API_URL || "";
            const baseUrl = apiUrl.startsWith('http') ? apiUrl : `${window.location.origin}${apiUrl}`;
            const response = await fetch(`${baseUrl}/voice/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: commandToProcess })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Voice command result:", data);

            // Speak confirmation message
            if (data.confirmation_message) {
                const utterance = new SpeechSynthesisUtterance(data.confirmation_message);
                const langMap = { 'en': 'en-US', 'hi': 'hi-IN', 'mr': 'mr-IN' };
                utterance.lang = langMap[language] || 'en-US';
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
                toast.success(data.confirmation_message);
            }

            // Handle different action types
            if (data.action === 'navigation' && data.target) {
                setTimeout(() => navigate(data.target), 1000);
            } else if (data.action === 'emergency_call') {
                if (data.emergency_status === 'success' || data.emergency_status === 'simulated') {
                    toast.success(`🚨 ${data.confirmation_message}`, { duration: 5000 });
                }
            }

        } catch (error) {
            console.error("Voice command error:", error);
            if (!isAutoMode) toast.error("Voice processing failed. Please try again.");
        } finally {
            setIsProcessing(false);
            setTranscriptText("");
        }
    };

    const startListening = () => {
        if (!isSupported) {
            toast.error("Voice recognition not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            // Configure recognition settings
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            
            // Set language based on app language
            const langMap = {
                'en': 'en-US',
                'hi': 'hi-IN', 
                'mr': 'mr-IN',
                'ta': 'ta-IN',
                'bn': 'bn-IN'
            };
            recognition.lang = langMap[language] || 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setTranscriptText("Listening... Say 'navigate to analytics' or 'call ambulance'");
                console.log("Voice recognition started:", recognition.lang);
                
                // Play start sound feedback
                const startUtterance = new SpeechSynthesisUtterance("Listening");
                startUtterance.volume = 0.3;
                startUtterance.rate = 1.5;
                window.speechSynthesis.speak(startUtterance);
            };

            recognition.onresult = (event) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    
                    if (event.results[i].isFinal) {
                        final += transcript;
                    } else {
                        interim += transcript;
                    }
                }

                // Show interim results for better UX
                if (interim) {
                    setTranscriptText(`Hearing: "${interim}"`);
                }
                
                // Process final result
                if (final) {
                    setTranscriptText(`Recognized: "${final}"`);
                    console.log("Final transcript:", final);
                    handleVoiceCommand(final);
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                
                // If auto-mode is on, we don't want to show errors for "no-speech"
                if (isAutoMode && event.error === 'no-speech') {
                    return;
                }

                setIsListening(false);
                const errorMessage = `Speech error: ${event.error}`;
                if (!isAutoMode) toast.error(errorMessage);
            };

            recognition.onend = () => {
                console.log("Voice recognition cycle ended");
                setIsListening(false);
                // AUTO RESTART for Autonomous Mode
                if (isAutoMode && !isProcessing) {
                    console.log("Autonomous Mode: Restarting listener...");
                    setTimeout(() => startListening(), 500);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();

        } catch (error) {
            console.error("Failed to start voice recognition:", error);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null; // Prevent auto-restart
            recognitionRef.current.stop();
        }
        setIsListening(false);
        setTranscriptText("");
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            setRetryCount(0);
            startListening();
        }
    };

    if (!isSupported) {
        return (
            <div className="relative flex items-center">
                <button
                    disabled
                    className="p-2 rounded-full bg-gray-600 cursor-not-allowed opacity-50"
                    title="Voice recognition not supported in this browser"
                >
                    <MicOff size={20} className="text-gray-400" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex items-center gap-3">
            {/* Visual Feedback Popup */}
            {(isListening || isProcessing || transcriptText) && (
                <div className="absolute top-12 right-0 bg-black/90 backdrop-blur-md border border-white/20 text-white text-sm px-4 py-3 rounded-lg whitespace-nowrap min-w-[200px] max-w-[300px] text-center z-50 shadow-lg">
                    {isListening && (
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-red-400 font-medium">{isAutoMode ? 'AUTONOMOUS' : 'LISTENING'}</span>
                        </div>
                    )}
                    {isProcessing && (
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            <span className="text-blue-400 font-medium">PROCESSING</span>
                        </div>
                    )}
                    <div className="text-xs text-gray-300 break-words italic">
                        {transcriptText || (isAutoMode ? "Awaiting Wake Word..." : "Ready")}
                    </div>
                </div>
            )}

            {/* AUTONOMOUS MODE TOGGLE */}
            <button
                onClick={() => {
                    if (isAutoMode) {
                        setIsAutoMode(false);
                        stopListening();
                    } else {
                        setIsAutoMode(true);
                        toast.success("Autonomous Mode: Always Listening for 'Hey Sankat Saathi'");
                    }
                }}
                className={`
                    p-3 rounded-full transition-all border
                    ${isAutoMode 
                        ? 'bg-purple-600 border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.5)]' 
                        : 'bg-gray-800 border-white/10 hover:border-purple-500/50'
                    }
                `}
                title={isAutoMode ? "Turn off Hands-free" : "Turn on Hands-free (Hey SankatSaathi)"}
            >
                <BrainCircuit size={20} className={isAutoMode ? 'text-white' : 'text-gray-500'} />
            </button>

            {/* MANUAL PUSH-TO-TALK */}
            <button
                onClick={toggleListening}
                disabled={isProcessing || isAutoMode}
                className={`
                    relative p-3 rounded-full transition-all duration-300
                    flex items-center justify-center
                    ${isListening 
                        ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.6)]' 
                        : 'bg-gray-800 border border-white/10 hover:border-white/20'
                    }
                    ${isAutoMode ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title="Manual Voice Control"
            >
                {isListening ? <Mic size={20} className="text-white" /> : <MicOff size={20} className="text-gray-400" />}
                
                {isListening && !isAutoMode && (
                    <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75"></span>
                )}
            </button>
        </div>
    );
};

export default VoiceNavigator;
