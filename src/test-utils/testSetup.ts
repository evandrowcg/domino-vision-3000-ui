// @ts-nocheck
// Shared test setup for Webcam component tests
// Type checking disabled to avoid issues with jest mock types

// Mock HTMLMediaElement.prototype.play/pause
export const setupMediaElementMocks = () => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
};

// TensorFlow mock configuration
export const tensorFlowMock = {
  loadGraphModel: vi.fn().mockResolvedValue({
    inputs: [{ shape: [1, 640, 640, 3] }],
    execute: vi.fn().mockReturnValue({
      transpose: vi.fn().mockReturnThis(),
      slice: vi.fn().mockReturnThis(),
      sub: vi.fn().mockReturnThis(),
      add: vi.fn().mockReturnThis(),
      div: vi.fn().mockReturnThis(),
      squeeze: vi.fn().mockReturnThis(),
      max: vi.fn().mockReturnThis(),
      argMax: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
      data: vi.fn().mockResolvedValue(new Float32Array(100)),
      shape: [1, 100, 4],
    }),
  }),
  browser: {
    fromPixels: vi.fn().mockReturnValue({
      mean: vi.fn().mockReturnThis(),
      div: vi.fn().mockReturnThis(),
      expandDims: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    }),
  },
  image: {
    resizeBilinear: vi.fn().mockReturnValue({
      div: vi.fn().mockReturnThis(),
      expandDims: vi.fn().mockReturnThis(),
      dispose: vi.fn(),
    }),
    nonMaxSuppressionAsync: vi.fn().mockResolvedValue({
      data: vi.fn().mockResolvedValue(new Int32Array([0])),
      dispose: vi.fn(),
    }),
  },
  tidy: vi.fn((fn: () => unknown) => fn()),
  concat: vi.fn().mockReturnValue({
    squeeze: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
    data: vi.fn().mockResolvedValue(new Float32Array(100)),
    shape: [100, 4],
  }),
};

export const mockModelConfig = {
  modelUrl: '/models/test/model.json',
  modelClasses: ['0x0', '0x1', '1x1', '0x2', '1x2', '2x2'],
};
