import { useState, useCallback, useEffect, RefObject } from 'react';

interface UseCameraOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
}

interface UseCameraReturn {
  lightOn: boolean;
  showTorchDialog: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setShowTorchDialog: (show: boolean) => void;
  toggleLight: () => void;
  startVideo: () => Promise<void>;
}

export const useCamera = ({ videoRef }: UseCameraOptions): UseCameraReturn => {
  const [lightOn, setLightOn] = useState(false);
  const [showTorchDialog, setShowTorchDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleLight = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if ('torch' in capabilities && (capabilities as Record<string, unknown>).torch !== undefined) {
        track.applyConstraints({ advanced: [{ torch: !lightOn } as unknown as MediaTrackConstraintSet] })
          .then(() => setLightOn(!lightOn))
          .catch((error) => console.error("Error toggling torch:", error));
      } else {
        setShowTorchDialog(true);
        console.warn("Torch is not supported on this device.");
      }
    }
  }, [lightOn, videoRef]);

  const startVideo = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('getUserMedia not supported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing/playing video:', err);
    }
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoRef]);

  return {
    lightOn,
    showTorchDialog,
    loading,
    setLoading,
    setShowTorchDialog,
    toggleLight,
    startVideo,
  };
};
