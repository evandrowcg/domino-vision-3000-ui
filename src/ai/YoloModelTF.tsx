import * as tf from '@tensorflow/tfjs';

export interface Prediction {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export class YoloModelTF {
  private model: tf.GraphModel | null = null;
  private modelWidth: number = 0;
  private modelHeight: number = 0;

  constructor(private modelUrl: string, private classNames: string[]) {}

  /**
   * Loads the YOLO model from the provided URL.
   */
  async loadModel(): Promise<tf.GraphModel> {
    if (!this.model) {
      try {
        this.model = await tf.loadGraphModel(this.modelUrl);
        // Assume input shape is [batch, width, height, channels]
        const [modelWidth, modelHeight] = this.model.inputs[0].shape!.slice(1, 3);
        this.modelWidth = modelWidth;
        this.modelHeight = modelHeight;
        console.log('YOLO model loaded successfully.');
      } catch (error) {
        console.error('Error loading YOLO model:', error);
        throw error;
      }
    }
    return this.model;
  }

  /**
   * Runs the YOLO model prediction on a given input image.
   * @param input A canvas element with the input image.
   * @returns A list of Prediction objects, or empty array on error.
   */
  async predict(input: HTMLCanvasElement): Promise<Prediction[]> {
    try {
      // Ensure the model is loaded.
      if (!this.model) {
        await this.loadModel();
      }

      // Preprocess the image:
    // Instead of performing three slice operations for grayscale conversion using weighted sum,
    // we approximate by taking the mean across channels.
    const batchedInput = tf.tidy(() => {
      const tensorInput = tf.browser.fromPixels(input);
      // Approximate grayscale conversion using mean (if acceptable).
      const gray = tensorInput.mean(2, true) as tf.Tensor3D;
      // Replicate the grayscale channel 3 times.
      const threeChannel = tf.concat([gray, gray, gray], 2);
      const resizedInput = tf.image.resizeBilinear(threeChannel, [this.modelWidth, this.modelHeight]);
      const normalizedInput = resizedInput.div(255.0);
      return normalizedInput.expandDims(0);
    });

    // Run model inference.
    const predictions = this.model!.execute(batchedInput);
    batchedInput.dispose();

    // Process prediction output.
    // Wrap subsequent operations in a tidy to manage memory.
    const [boxes, scores, classes] = tf.tidy(() => {
      // Transpose predictions for easier slicing.
      const predictionTransposed = (predictions as tf.Tensor).transpose([0, 2, 1]);

      // Compute bounding boxes.
      const width = predictionTransposed.slice([0, 0, 2], [-1, -1, 1]);
      const height = predictionTransposed.slice([0, 0, 3], [-1, -1, 1]);
      const x1 = predictionTransposed.slice([0, 0, 0], [-1, -1, 1]).sub(width.div(2));
      const y1 = predictionTransposed.slice([0, 0, 1], [-1, -1, 1]).sub(height.div(2));
      const x2 = x1.add(width);
      const y2 = y1.add(height);
      const boxesTensor = tf.concat([x1, y1, x2, y2], 2).squeeze() as tf.Tensor2D;

      // Extract scores and class indices.
      const scoreTensor = predictionTransposed.slice([0, 0, 4], [-1, -1, this.classNames.length]).squeeze();
      const s = scoreTensor.max(1) as tf.Tensor1D;
      const c = scoreTensor.argMax(1) as tf.Tensor1D;

      return [boxesTensor, s, c];
    });

    // Non-Maximum Suppression.
    const nmsIndices = await tf.image.nonMaxSuppressionAsync(
      boxes,
      scores as tf.Tensor1D,
      boxes.shape[0],
      0.5, // IoU threshold.
      0.5  // Score threshold.
    );
    const selectedIndicesTypedArray = await nmsIndices.data();
    nmsIndices.dispose();

    // Extract tensor data.
    const [boxesDataFlat, scoresData, classesData] = await Promise.all([
      boxes.data(),
      scores.data(),
      classes.data()
    ]);
    boxes.dispose();
    scores.dispose();
    classes.dispose();

    // Reshape flat boxes data into array of [x1, y1, x2, y2].
    const numBoxes = boxes.shape[0];
    const numCoords = boxes.shape[1];
    const boxesData: number[][] = [];
    for (let i = 0; i < numBoxes; i++) {
      boxesData.push([
        boxesDataFlat[i * numCoords],
        boxesDataFlat[i * numCoords + 1],
        boxesDataFlat[i * numCoords + 2],
        boxesDataFlat[i * numCoords + 3],
      ]);
    }

    // Scale boxes back to original image dimensions.
    const originalWidth = input.width;
    const originalHeight = input.height;
    const scaleX = originalWidth / this.modelWidth;
    const scaleY = originalHeight / this.modelHeight;

    // Build final detections array.
    const detections: Prediction[] = [];
    const selectedIndicesArray = Array.from(selectedIndicesTypedArray);
    for (const index of selectedIndicesArray) {
      const score = scoresData[index];
      if (score < 0.5) continue;
      const box = boxesData[index]; // [x1, y1, x2, y2]
      const x = box[0] * scaleX;
      const y = box[1] * scaleY;
      const width = (box[2] - box[0]) * scaleX;
      const height = (box[3] - box[1]) * scaleY;
      detections.push({
        class: this.classNames[classesData[index]] || 'unknown',
        score: score,
        bbox: [x, y, width, height],
      });
    }

    return detections;
    } catch (error) {
      console.error('Error during model prediction:', error);
      return [];
    }
  }
}
