import React, { FC } from "react";
import Webcam from "../Webcam/Webcam";
import { DOMINO_YOLOV8s } from "../../ai/ModelConfig";

interface SolveProps {}

const Solve: FC<SolveProps> = () => <>
Solve Component
    <Webcam modelConfig={ DOMINO_YOLOV8s }></Webcam>
</>;

export default Solve;
