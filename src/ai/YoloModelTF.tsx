import * as tf from '@tensorflow/tfjs';

export interface Prediction {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export class YoloModelTF {
  // Adjust these class names to match your model.
  private CLASS_NAMES = [
    "3x6", "3x10", "2x5", "11x11", "0x8", "4x10", "1x6", "5x9", "0x3", "4x8",
    "2x12", "11x12", "9x9", "2x11", "6x11", "3x12", "5x5", "3x11", "4x6", "5x8",
    "2x2", "3x3", "5x11", "9x12", "7x11", "1x11", "9x11", "4x12", "4x4", "5x10",
    "0x4", "7x9", "2x9", "7x12", "2x4", "5x7", "5x12", "7x7", "10x12", "8x8",
    "1x1", "2x3", "3x9", "8x9", "12x12", "0x6", "7x8", "8x11", "6x7", "2x8",
    "3x4", "0x11", "1x7", "0x2", "3x5", "1x10", "6x8", "1x8", "0x1", "1x3",
    "6x6", "2x10", "0x10", "6x12", "1x2", "0x9", "4x9", "1x4", "0x12", "2x7",
    "10x10", "0x7", "4x7", "10x11", "8x12", "6x9", "2x6", "3x7", "3x8", "1x12",
    "4x11", "1x5", "7x10", "5x6", "9x10", "8x10", "4x5", "0x5", "0x0", "6x10",
    "1x9"
  ];
  private model: tf.GraphModel | null = null;
  private modelWidth: number = 0;
  private modelHeight: number = 0;

  constructor(private modelUrl: string) {}

  /**
   * Loads the YOLO model from the provided URL.
   */
  async loadModel(): Promise<tf.GraphModel> {
    if (!this.model) {
      try {
        this.model = await tf.loadGraphModel(this.modelUrl);
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
   * @returns A list of Prediction objects.
   */
  async predict(input: HTMLCanvasElement): Promise<Prediction[]> {
    if (!this.model) {
      await this.loadModel();
    }

    // Preprocess the image: convert from canvas, resize, normalize, and add a batch dimension.
    const batchedInput = tf.tidy(() => {
      const tensorInput = tf.browser.fromPixels(input);
      const resizedInput = tf.image.resizeBilinear(tensorInput, [this.modelWidth, this.modelHeight]);
      const normalizedInput = resizedInput.div(255.0);
      return normalizedInput.expandDims(0);
    });

    // Run model inference.
    const predictions = this.model!.execute(batchedInput);
    batchedInput.dispose();

    // Inlined getPredictionData logic:
    // Transpose the prediction tensor.
    const predictionTransposed = (predictions as tf.Tensor).transpose([0, 2, 1]);

    // Compute bounding boxes.
    const boxes = tf.tidy(() => {
      const width = predictionTransposed.slice([0, 0, 2], [-1, -1, 1]);
      const height = predictionTransposed.slice([0, 0, 3], [-1, -1, 1]);
      const x1 = tf.sub(predictionTransposed.slice([0, 0, 0], [-1, -1, 1]), tf.div(width, 2));
      const y1 = tf.sub(predictionTransposed.slice([0, 0, 1], [-1, -1, 1]), tf.div(height, 2));
      const x2 = tf.add(x1, width);
      const y2 = tf.add(y1, height);
      return tf.concat([x1, y1, x2, y2], 2).squeeze() as tf.Tensor2D;
    });

    // Extract scores and class indices.
    const [scores, classes] = tf.tidy(() => {
      const scoreTensor = predictionTransposed.slice([0, 0, 4], [-1, -1, this.CLASS_NAMES.length]).squeeze();
      const s = scoreTensor.max(1) as tf.Tensor1D;
      const c = scoreTensor.argMax(1) as tf.Tensor1D;
      return [s, c];
    });
    predictionTransposed.dispose();
    // End of inlined logic.

    // Apply non-maximum suppression.
    const nmsIndices = await tf.image.nonMaxSuppressionAsync(
      boxes,
      scores as tf.Tensor1D,
      boxes.shape[0],
      0.5, // IoU threshold.
      0.5  // Score threshold.
    );
    const selectedIndicesTypedArray = await nmsIndices.data();
    nmsIndices.dispose();

    // Get number of boxes and coordinates per box.
    const [numBoxes, numCoords] = boxes.shape as [number, number];

    // Extract data from tensors concurrently.
    const [boxesDataFlat, scoresData, classesData] = await Promise.all([
      boxes.data(),
      scores.data(),
      classes.data()
    ]);
    boxes.dispose();
    scores.dispose();
    classes.dispose();

    // Reshape the flat boxes data into an array of [x1, y1, x2, y2].
    const boxesData: number[][] = [];
    for (let i = 0; i < numBoxes; i++) {
      boxesData.push([
        boxesDataFlat[i * numCoords],
        boxesDataFlat[i * numCoords + 1],
        boxesDataFlat[i * numCoords + 2],
        boxesDataFlat[i * numCoords + 3]
      ]);
    }

    // Calculate scale factors to map boxes back to the original image dimensions.
    const originalWidth = input.width;
    const originalHeight = input.height;
    const scaleX = originalWidth / this.modelWidth;
    const scaleY = originalHeight / this.modelHeight;

    // Build final detections array using the selected indices.
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
        class: this.CLASS_NAMES[classesData[index]] || 'unknown',
        score: score,
        bbox: [x, y, width, height]
      });
    }

    return detections;
  }
}
