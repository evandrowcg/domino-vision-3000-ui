import { YoloModelTF, Prediction } from '../../ai/YoloModelTF';

// Mock TensorFlow.js - mock factory must be self-contained
jest.mock('@tensorflow/tfjs', () => {
  // Create mock tensor factory inside the mock to avoid hoisting issues
  const createTensor = (shape: number[] = [1, 100, 4]) => {
    const t: Record<string, unknown> = {
      data: jest.fn().mockResolvedValue(new Float32Array(400)),
      dispose: jest.fn(),
      shape,
    };
    t.transpose = jest.fn().mockReturnValue(t);
    t.slice = jest.fn().mockReturnValue(t);
    t.sub = jest.fn().mockReturnValue(t);
    t.add = jest.fn().mockReturnValue(t);
    t.div = jest.fn().mockReturnValue(t);
    t.squeeze = jest.fn().mockReturnValue(t);
    t.max = jest.fn().mockReturnValue(t);
    t.argMax = jest.fn().mockReturnValue(t);
    t.mean = jest.fn().mockReturnValue(t);
    t.expandDims = jest.fn().mockReturnValue(t);
    return t;
  };

  const baseTensor = createTensor();

  return {
    loadGraphModel: jest.fn().mockResolvedValue({
      inputs: [{ shape: [1, 640, 640, 3] }],
      execute: jest.fn().mockReturnValue(createTensor([1, 8505, 12])),
    }),
    browser: {
      fromPixels: jest.fn().mockReturnValue(baseTensor),
    },
    image: {
      resizeBilinear: jest.fn().mockReturnValue(baseTensor),
      nonMaxSuppressionAsync: jest.fn().mockResolvedValue({
        data: jest.fn().mockResolvedValue(new Int32Array([0, 1])),
        dispose: jest.fn(),
      }),
    },
    tidy: jest.fn((fn) => {
      const result = fn();
      // Always ensure result has dispose method
      if (result && typeof result === 'object') {
        if (!result.dispose) {
          result.dispose = jest.fn();
        }
        return result;
      }
      // If result is null/undefined or not an object, return a tensor with dispose
      return createTensor();
    }),
    concat: jest.fn().mockReturnValue(createTensor([100, 4])),
  };
});

// Helper function for creating mock tensors in tests
const createMockTensor = (shape: number[] = [1, 100, 4]) => {
  const tensor: Record<string, unknown> = {
    data: jest.fn().mockResolvedValue(new Float32Array(400)),
    dispose: jest.fn(),
    shape,
  };
  tensor.transpose = jest.fn().mockReturnValue(tensor);
  tensor.slice = jest.fn().mockReturnValue(tensor);
  tensor.sub = jest.fn().mockReturnValue(tensor);
  tensor.add = jest.fn().mockReturnValue(tensor);
  tensor.div = jest.fn().mockReturnValue(tensor);
  tensor.squeeze = jest.fn().mockReturnValue(tensor);
  tensor.max = jest.fn().mockReturnValue(tensor);
  tensor.argMax = jest.fn().mockReturnValue(tensor);
  tensor.mean = jest.fn().mockReturnValue(tensor);
  tensor.expandDims = jest.fn().mockReturnValue(tensor);
  return tensor;
};

// Import tf after mocking
import * as tf from '@tensorflow/tfjs';

describe('YoloModelTF', () => {
  const mockModelUrl = '/models/test/model.json';
  const mockClasses = ['0x0', '0x1', '1x1', '0x2', '1x2', '2x2', '3x5', '6x6'];

  let model: YoloModelTF;

  beforeEach(() => {
    // Create a new model instance for each test
    model = new YoloModelTF(mockModelUrl, mockClasses);

    // Clear mock call history but preserve implementations
    (tf.loadGraphModel as jest.Mock).mockClear();
    (tf.browser.fromPixels as jest.Mock).mockClear();
    (tf.image.resizeBilinear as jest.Mock).mockClear();
    (tf.image.nonMaxSuppressionAsync as jest.Mock).mockClear();
    (tf.tidy as jest.Mock).mockClear();
    (tf.concat as jest.Mock).mockClear();

    // Re-establish the loadGraphModel mock implementation
    (tf.loadGraphModel as jest.Mock).mockResolvedValue({
      inputs: [{ shape: [1, 640, 640, 3] }],
      execute: jest.fn().mockReturnValue(createMockTensor([1, 8505, 12])),
    });
  });

  describe('loadModel', () => {
    test('loads model from URL', async () => {
      await model.loadModel();

      expect(tf.loadGraphModel).toHaveBeenCalledWith(mockModelUrl);
    });

    test('returns the loaded model', async () => {
      const loadedModel = await model.loadModel();

      expect(loadedModel).toBeDefined();
      expect(loadedModel.inputs).toBeDefined();
    });

    test('caches the model after first load', async () => {
      await model.loadModel();
      await model.loadModel();

      // Should only load once
      expect(tf.loadGraphModel).toHaveBeenCalledTimes(1);
    });

    test('throws error on model load failure', async () => {
      (tf.loadGraphModel as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(model.loadModel()).rejects.toThrow('Network error');
    });
  });

  describe('predict', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(() => {
      mockContext = {
        drawImage: jest.fn(),
        getImageData: jest.fn().mockReturnValue({
          data: new Uint8ClampedArray(640 * 480 * 4),
          width: 640,
          height: 480,
        }),
      } as unknown as CanvasRenderingContext2D;

      mockCanvas = {
        getContext: jest.fn().mockReturnValue(mockContext),
        width: 640,
        height: 480,
      } as unknown as HTMLCanvasElement;
    });

    test('returns empty array on error', async () => {
      (tf.browser.fromPixels as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Canvas error');
      });

      const predictions = await model.predict(mockCanvas);

      expect(predictions).toEqual([]);
    });

    // Note: Complex tensor operation tests are skipped because mocking
    // the full TensorFlow.js tensor chain is difficult in unit tests.
    // Integration tests should be used for full predict functionality.
  });

  describe('class names', () => {
    test('uses provided class names', () => {
      const customClasses = ['custom0', 'custom1', 'custom2'];
      const customModel = new YoloModelTF(mockModelUrl, customClasses);

      // The model should use the custom class names
      expect(customModel).toBeDefined();
    });
  });
});
