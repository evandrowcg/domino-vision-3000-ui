// @ts-nocheck
// Shared test setup for Webcam component tests
// Type checking disabled to avoid issues with jest mock types

// Mock HTMLMediaElement.prototype.play/pause
export const setupMediaElementMocks = () => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    writable: true,
    value: jest.fn(),
  });
};

// TensorFlow mock configuration
export const tensorFlowMock = {
  loadGraphModel: jest.fn().mockResolvedValue({
    inputs: [{ shape: [1, 640, 640, 3] }],
    execute: jest.fn().mockReturnValue({
      transpose: jest.fn().mockReturnThis(),
      slice: jest.fn().mockReturnThis(),
      sub: jest.fn().mockReturnThis(),
      add: jest.fn().mockReturnThis(),
      div: jest.fn().mockReturnThis(),
      squeeze: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      argMax: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
      data: jest.fn().mockResolvedValue(new Float32Array(100)),
      shape: [1, 100, 4],
    }),
  }),
  browser: {
    fromPixels: jest.fn().mockReturnValue({
      mean: jest.fn().mockReturnThis(),
      div: jest.fn().mockReturnThis(),
      expandDims: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
    }),
  },
  image: {
    resizeBilinear: jest.fn().mockReturnValue({
      div: jest.fn().mockReturnThis(),
      expandDims: jest.fn().mockReturnThis(),
      dispose: jest.fn(),
    }),
    nonMaxSuppressionAsync: jest.fn().mockResolvedValue({
      data: jest.fn().mockResolvedValue(new Int32Array([0])),
      dispose: jest.fn(),
    }),
  },
  tidy: jest.fn((fn: () => unknown) => fn()),
  concat: jest.fn().mockReturnValue({
    squeeze: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
    data: jest.fn().mockResolvedValue(new Float32Array(100)),
    shape: [100, 4],
  }),
};

export const mockModelConfig = {
  modelUrl: '/models/test/model.json',
  modelClasses: ['0x0', '0x1', '1x1', '0x2', '1x2', '2x2'],
};
