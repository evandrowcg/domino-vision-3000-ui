import { FC, useState, useCallback, useRef } from "react";
import Webcam from "../Webcam/Webcam";
import { DOMINO_YOLOV8s } from "../../ai/ModelConfig";
import { Prediction } from "../../ai/YoloModelTF";

interface CountProps {}

const Count: FC<CountProps> = () => {
  // State variable to store the total sum of detection values.
  const [total, setTotal] = useState<number>(0);
  // Ref to track the previous total sum, preventing unnecessary state updates.
  const prevTotalRef = useRef<number>(0);

  /**
   * Callback function to process new detection predictions.
   * 
   * For each detection, the "class" string (formatted as "num1xnum2x...") 
   * is split by "x" to extract individual numeric values. These values are 
   * parsed and summed to compute a detection sum. All detection sums are then 
   * aggregated to produce a final total sum.
   *
   * The total sum is compared with the previously stored sum, and if different, 
   * the state is updated.
   *
   * @param newDetections - Array of detection predictions.
   */
  const handleDetections = useCallback((newDetections: Prediction[]) => {
    const newTotal: number = newDetections.reduce((acc, det) => {
      // Split the class string by "x" to extract numeric parts.
      const parts = det.class.split("x");
      // Sum the parsed integer values for this detection.
      const detectionSum = parts.reduce((sum, part) => sum + parseInt(part, 10), 0);
      return acc + detectionSum;
    }, 0);

    // Update the state only if the new total differs from the previous total.
    if (newTotal !== prevTotalRef.current) {
      prevTotalRef.current = newTotal;
      setTotal(newTotal);
    }
  }, []);

  return (
    <>
      <h1>Count Component</h1>
      <Webcam modelConfig={DOMINO_YOLOV8s} onDetections={handleDetections} />
      <div style={{ marginTop: "20px" }}>
        Total: {total}
      </div>
    </>
  );
};

export default Count;
