import React, { useRef, useEffect } from 'react';
import { Card, CardContent, Typography } from '@mui/material';

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let animationFrameId: number;

  // Placeholder YOLO inference function.
  const runYoloInference = async (input: HTMLCanvasElement): Promise<Detection[]> => {
    return new Promise((resolve) => {
      resolve([{
        class: 'dummy-object',
        score: 0.9,
        bbox: [
          input.width / 4,
          input.height / 4,
          input.width / 2,
          input.height / 2
        ]
      }]);
    });
  };

  // Process each video frame.
  const processFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas dimensions to match the video feed.
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Draw the current video frame to the canvas.
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Run YOLO inference on the current frame.
        const detections = await runYoloInference(canvas);

        // Draw detection bounding boxes.
        detections.forEach(detection => {
          const [x, y, width, height] = detection.bbox;
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = 'red';
          ctx.font = '18px Arial';
          ctx.fillText(
            `${detection.class} (${(detection.score * 100).toFixed(1)}%)`,
            x,
            y > 20 ? y - 5 : y + 20
          );
        });
      }
    }
    animationFrameId = requestAnimationFrame(processFrame);
  };

  const startVideo = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Request the video stream from the rear camera.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    } else {
      console.error("getUserMedia not supported in this browser");
    }
  };

  useEffect(() => {
    // Automatically start video.
    startVideo();
    const video = videoRef.current;
    if (video) {
      // Once the video has loaded data, start processing frames.
      video.addEventListener('loadeddata', () => {
        processFrame();
      });
    }

    return () => {
      // Cleanup: stop video tracks and cancel animation frames.
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <Card style={{ maxWidth: 800, margin: '20px auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          YOLO Inference with Rear Camera
        </Typography>
        <div style={{ position: 'relative' }}>
          {/* Hidden video element rendered for the stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '0px', height: '0px', opacity: 0 }}
            {...{ "webkit-playsinline": "true" }}
          />
          <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 4 }} />
        </div>
      </CardContent>
    </Card>
  );
};

export default Webcam;
