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
      const scoreTensor = predictionTransposed.slice([0, 0, 4], [-1, -1, this.classNames.length]).squeeze();
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
        class: this.classNames[classesData[index]] || 'unknown',
        score: score,
        bbox: [x, y, width, height]
      });
    }

    return detections;
  }
}
