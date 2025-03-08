import React, { FC, useState, useCallback, useRef, useEffect } from "react";
import Webcam from "../Webcam/Webcam";
import { DOMINO_YOLOV8s } from "../../ai/ModelConfig";
import { Prediction } from "../../ai/YoloModelTF";
import { combine } from "../../utils/tiles"; 

interface SolveProps {}

/**
 * Solve Component
 *
 * This component integrates a webcam feed with AI detections. It converts detection strings
 * (formatted as "num1xnum2") into numeric pairs, then uses these pairs along with a user-selected 
 * starting value to compute a composed response via an external combine() function.
 */
const Solve: FC<SolveProps> = () => {
  // State to store detection pairs extracted from the webcam predictions.
  const [detectionPairs, setDetectionPairs] = useState<number[][]>([]);
  // State to store the response generated from combining the detection pairs.
  const [composeResponse, setComposeResponse] = useState<any[]>([]);
  // State to store the user-selected starting value from the dropdown.
  const [selectedValue, setSelectedValue] = useState<number>(0);
  // Ref to keep track of the previous detection pairs to prevent unnecessary updates.
  const prevPairsRef = useRef<number[][]>([]);

  /**
   * Processes new detections from the Webcam component.
   *
   * Converts each detection's class string (e.g., "3x4") into an array of numbers ([3, 4]).
   * The new pairs are compared with the previously stored pairs using JSON.stringify.
   * The state is updated only if the pairs have changed.
   *
   * @param newDetections - Array of detection predictions from the AI model.
   */
  const handleDetections = useCallback((newDetections: Prediction[]) => {
    // Convert each detection's class string to a numeric array.
    const pairs: number[][] = newDetections.map((det) => {
      const parts = det.class.split("x");
      return parts.map((part) => parseInt(part, 10));
    });

    // Update state only if the detection pairs have changed.
    if (JSON.stringify(pairs) !== JSON.stringify(prevPairsRef.current)) {
      prevPairsRef.current = pairs;
      setDetectionPairs(pairs);
    }
  }, []);

  /**
   * Handles changes in the dropdown selection.
   *
   * Updates the selected starting value based on the user's input.
   *
   * @param event - The change event from the dropdown.
   */
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value, 10);
    setSelectedValue(value);
  };

  /**
   * useEffect hook to update the composed response whenever detection pairs
   * or the selected starting value changes.
   *
   * Calls the async combine() function with the current detection pairs and selected value.
   * If there are detection pairs, it sets the computed response; otherwise, it resets the response.
   */
  useEffect(() => {
    async function updateComposeResponse() {
      if (detectionPairs.length > 0) {
        const response = await combine(detectionPairs, selectedValue);
        setComposeResponse(response);
      } else {
        setComposeResponse([]);
      }
    }
    updateComposeResponse();
  }, [detectionPairs, selectedValue]);

  return (
    <>
      <h1>Solve Component</h1>
      {/* Webcam component that provides AI detections via the handleDetections callback */}
      <Webcam modelConfig={DOMINO_YOLOV8s} onDetections={handleDetections} />
      <div style={{ marginTop: "20px" }}>
        {/* Dropdown to allow the user to select a starting value */}
        <div style={{ marginTop: "20px" }}>
          <label htmlFor="dropdown">Starting value: </label>
          <select id="dropdown" onChange={handleSelectChange} value={selectedValue}>
            {Array.from({ length: 13 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        {/* Render composed response table if there are detection pairs and a valid response */}
        {detectionPairs.length > 0 && composeResponse && composeResponse.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h2>Paths:</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Sequence Length</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Sequence Score</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Unused Score</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Unused Pieces</th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>Sequence</th>
                </tr>
              </thead>
              <tbody>
                {composeResponse.map((item, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{item.sequenceLength}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{item.sequenceScore}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{item.unusedScore}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{item.unused}</td>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>{item.sequence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Solve;
