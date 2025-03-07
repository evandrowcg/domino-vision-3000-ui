import React, { FC, useState } from "react";
import Webcam from "../Webcam/Webcam";
import { DOMINO_YOLOV8s } from "../../ai/ModelConfig";
import { Prediction } from "../../ai/YoloModelTF";

interface SolveProps {}

const Solve: FC<SolveProps> = () => {
  // State to store detections coming from the Webcam component.
  const [detections, setDetections] = useState<Prediction[]>([]);

  return (
    <>
      <h1>Solve Component</h1>
      <Webcam
        modelConfig={DOMINO_YOLOV8s}
        onDetections={(newDetections: Prediction[]) => setDetections(newDetections)}
      />
      <div style={{ marginTop: '20px' }}>
        <h2>Detections:</h2>
        {detections.length === 0 ? (
          <p>No detections available.</p>
        ) : (
          <ul>
            {detections.map((det, idx) => (
              <li key={idx}>
                {det.class}: {(det.score * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default Solve;
