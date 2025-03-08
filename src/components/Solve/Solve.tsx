import React, { FC, useState, useCallback, useRef, useEffect } from "react";
import Webcam from "../Webcam/Webcam";
import { DOMINO_YOLOV8s } from "../../ai/ModelConfig";
import { Prediction } from "../../ai/YoloModelTF";
import { combine } from "../../utils/tiles"; 

interface SolveProps {}

const Solve: FC<SolveProps> = () => {
  // State to store parsed detection classes as an array of number pairs.
  const [detectionPairs, setDetectionPairs] = useState<number[][]>([]);
  // State to store the response from the combine method.
  const [composeResponse, setComposeResponse] = useState<any[]>([]);
  // State to store the selected dropdown value.
  const [selectedValue, setSelectedValue] = useState<number>(1);
  // Ref to keep track of the previous detection pairs.
  const prevPairsRef = useRef<number[][]>([]);

  // Convert detection classes from "0x0" to [0, 0] format and update state only if changed.
  const handleDetections = useCallback((newDetections: Prediction[]) => {
    const pairs: number[][] = newDetections.map((det) => {
      const parts = det.class.split("x");
      return parts.map((part) => parseInt(part, 10));
    });

    // Compare the new pairs with the previous ones to avoid unnecessary re-renders.
    if (JSON.stringify(pairs) !== JSON.stringify(prevPairsRef.current)) {
      prevPairsRef.current = pairs;
      setDetectionPairs(pairs);
    }
  }, []);

  // Update the selected value when dropdown changes.
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(event.target.value, 10);
    setSelectedValue(value);
  };

  // Update composeResponse whenever detectionPairs or selectedValue changes.
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
      <Webcam modelConfig={DOMINO_YOLOV8s} onDetections={handleDetections} />
      <div style={{ marginTop: "20px" }}>
        {detectionPairs.length > 0 && (
          <>
            <div style={{ marginTop: "20px" }}>
              <label htmlFor="dropdown">Select a value: </label>
              <select 
                id="dropdown" 
                onChange={handleSelectChange} 
                value={selectedValue}
              >
                {Array.from({ length: 13 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            {composeResponse && composeResponse.length > 0 && (
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
          </>
        )}
      </div>
    </>
  );
};

export default Solve;
