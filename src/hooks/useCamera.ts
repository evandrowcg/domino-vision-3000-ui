import { useState, useCallback, useEffect, RefObject } from 'react';

// Extended types for torch (flashlight) API - not in standard TypeScript definitions
interface MediaTrackCapabilitiesWithTorch extends MediaTrackCapabilities {
  torch?: boolean;
}

interface MediaTrackConstraintSetWithTorch extends MediaTrackConstraintSet {
  torch?: boolean;
}

interface UseCameraOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
}

interface UseCameraReturn {
  lightOn: boolean;
  showTorchDialog: boolean;
  loading: boolean;
  cameraError: string | null;
  setLoading: (loading: boolean) => void;
  setShowTorchDialog: (show: boolean) => void;
  setCameraError: (error: string | null) => void;
  toggleLight: () => void;
  startVideo: () => Promise<void>;
}

export const useCamera = ({ videoRef }: UseCameraOptions): UseCameraReturn => {
  const [lightOn, setLightOn] = useState(false);
  const [showTorchDialog, setShowTorchDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const toggleLight = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as MediaTrackCapabilitiesWithTorch;
      if (capabilities.torch !== undefined) {
        const constraints: MediaTrackConstraints = {
          advanced: [{ torch: !lightOn } as MediaTrackConstraintSetWithTorch]
        };
        track.applyConstraints(constraints)
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
      setCameraError('Camera access is not supported in this browser.');
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
        setCameraError(null);
      }
    } catch (err) {
      console.error('Error accessing/playing video:', err);
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            setCameraError('Camera permission denied. Please allow camera access to use this feature.');
            break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            setCameraError('No camera found. Please connect a camera to use this feature.');
            break;
          case 'NotReadableError':
          case 'TrackStartError':
            setCameraError('Camera is in use by another application.');
            break;
          case 'OverconstrainedError':
            setCameraError('Camera does not meet the required constraints.');
            break;
          case 'AbortError':
            setCameraError('Camera access was aborted.');
            break;
          case 'SecurityError':
            setCameraError('Camera access is blocked due to security settings.');
            break;
          default:
            setCameraError('Unable to access camera. Please try again.');
        }
      } else {
        setCameraError('Unable to access camera. Please try again.');
      }
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
    cameraError,
    setLoading,
    setShowTorchDialog,
    setCameraError,
    toggleLight,
    startVideo,
  };
};
