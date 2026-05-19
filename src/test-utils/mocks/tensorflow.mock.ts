// @ts-nocheck
// Test utility - type checking disabled to avoid issues with jest mock types
import { jest } from '@jest/globals';

export const mockTensor = {
  data: vi.fn<() => Promise<Float32Array>>().mockResolvedValue(new Float32Array(100)),
  dispose: vi.fn(),
  shape: [1, 100, 4],
  transpose: vi.fn().mockReturnThis(),
  slice: vi.fn().mockReturnThis(),
  sub: vi.fn().mockReturnThis(),
  add: vi.fn().mockReturnThis(),
  div: vi.fn().mockReturnThis(),
  squeeze: vi.fn().mockReturnThis(),
  max: vi.fn().mockReturnThis(),
  argMax: vi.fn().mockReturnThis(),
  mean: vi.fn().mockReturnThis(),
  concat: vi.fn().mockReturnThis(),
  expandDims: vi.fn().mockReturnThis(),
};

export const mockGraphModel = {
  inputs: [{ shape: [1, 640, 640, 3] }],
  execute: vi.fn().mockReturnValue(mockTensor),
  predict: vi.fn().mockReturnValue(mockTensor),
  dispose: vi.fn(),
};

export const createMockTensorFlow = () => ({
  loadGraphModel: vi.fn<() => Promise<typeof mockGraphModel>>().mockResolvedValue(mockGraphModel),
  browser: {
    fromPixels: vi.fn().mockReturnValue(mockTensor),
  },
  image: {
    resizeBilinear: vi.fn().mockReturnValue(mockTensor),
    nonMaxSuppressionAsync: vi.fn<() => Promise<typeof mockTensor>>().mockResolvedValue({
      ...mockTensor,
      data: vi.fn<() => Promise<Int32Array>>().mockResolvedValue(new Int32Array([0, 1, 2])),
    } as unknown as typeof mockTensor),
  },
  tidy: vi.fn((fn: () => unknown) => fn()),
  concat: vi.fn().mockReturnValue(mockTensor),
  dispose: vi.fn(),
});

export const setupTensorFlowMock = () => {
  const mockTf = createMockTensorFlow();
  vi.mock('@tensorflow/tfjs', () => mockTf);
  return mockTf;
};
