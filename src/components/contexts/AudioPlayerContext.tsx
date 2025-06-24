import React, { createContext, useContext, useRef, useState } from "react";

interface AudioPlayerState {
  currentTrackUrl: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AudioPlayerContextType {
  state: AudioPlayerState;
  play: (url: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
};

interface AudioPlayerProviderProps {
  children: React.ReactNode;
}

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({ children }) => {
  const [state, setState] = useState<AudioPlayerState>({
    currentTrackUrl: null,
    isPlaying: false,
    isLoading: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeEventListener("ended", handleAudioEnded);
      audioRef.current.removeEventListener("error", handleAudioError);
      audioRef.current.removeEventListener("loadstart", handleAudioLoadStart);
      audioRef.current.removeEventListener("canplay", handleAudioCanPlay);
      audioRef.current = null;
    }
  };

  const handleAudioEnded = () => {
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      currentTrackUrl: null,
    }));
    cleanup();
  };

  const handleAudioError = (event: Event) => {
    const target = event.target as HTMLAudioElement;
    const errorMessage = target.error
      ? `Audio error: ${target.error.code} - ${target.error.message}`
      : "Failed to load audio";

    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isLoading: false,
      error: errorMessage,
    }));
    cleanup();
  };

  const handleAudioLoadStart = () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
  };

  const handleAudioCanPlay = () => {
    setState((prev) => ({
      ...prev,
      isLoading: false,
    }));
  };

  const play = async (url: string): Promise<void> => {
    try {
      // If the same track is already playing, pause it
      if (state.currentTrackUrl === url && state.isPlaying) {
        pause();
        return;
      }

      // Stop current audio if playing
      if (audioRef.current) {
        cleanup();
      }

      // Create new audio element
      const audio = new Audio(url);
      audioRef.current = audio;

      // Set up event listeners
      audio.addEventListener("ended", handleAudioEnded);
      audio.addEventListener("error", handleAudioError);
      audio.addEventListener("loadstart", handleAudioLoadStart);
      audio.addEventListener("canplay", handleAudioCanPlay);

      // Update state to loading
      setState((prev) => ({
        ...prev,
        currentTrackUrl: url,
        isLoading: true,
        isPlaying: false,
        error: null,
      }));

      // Start playback
      await audio.play();

      // Update state to playing
      setState((prev) => ({
        ...prev,
        isPlaying: true,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to play audio";
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: errorMessage,
      }));
      cleanup();
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState((prev) => ({
        ...prev,
        isPlaying: false,
      }));
    }
  };

  const stop = () => {
    setState((prev) => ({
      ...prev,
      currentTrackUrl: null,
      isPlaying: false,
      isLoading: false,
      error: null,
    }));
    cleanup();
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const contextValue: AudioPlayerContextType = {
    state,
    play,
    pause,
    stop,
  };

  return <AudioPlayerContext.Provider value={contextValue}>{children}</AudioPlayerContext.Provider>;
};
