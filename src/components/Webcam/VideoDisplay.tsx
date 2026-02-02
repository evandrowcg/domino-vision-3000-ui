import React from 'react';
import { useWebcamContext } from './WebcamContext';

const VideoDisplay: React.FC = () => {
  const {
    videoRef,
    uploadedImageRef,
    frozen,
    snapshot,
    uploadedDimensions,
  } = useWebcamContext();

  return (
    <>
      <video
        ref={videoRef}
        playsInline
        muted
        aria-label="Live camera feed"
        style={{
          width: '100%',
          borderRadius: 4,
          display: 'block',
          opacity: frozen ? 0 : 1,
        }}
      />
      {frozen && snapshot && (
        <img
          ref={uploadedImageRef}
          src={snapshot}
          alt="Frozen frame"
          style={
            uploadedDimensions
              ? {
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: 4,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                }
              : {
                  width: videoRef.current ? videoRef.current.clientWidth : '100%',
                  height: videoRef.current ? videoRef.current.clientHeight : '100%',
                  borderRadius: 4,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                }
          }
        />
      )}
    </>
  );
};

export default VideoDisplay;
