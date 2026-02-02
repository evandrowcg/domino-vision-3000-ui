// @ts-nocheck
// Test utility - type checking disabled to avoid issues with jest mock types
import { jest } from '@jest/globals';

export const mockTensor = {
  data: jest.fn<() => Promise<Float32Array>>().mockResolvedValue(new Float32Array(100)),
  dispose: jest.fn(),
  shape: [1, 100, 4],
  transpose: jest.fn().mockReturnThis(),
  slice: jest.fn().mockReturnThis(),
  sub: jest.fn().mockReturnThis(),
  add: jest.fn().mockReturnThis(),
  div: jest.fn().mockReturnThis(),
  squeeze: jest.fn().mockReturnThis(),
  max: jest.fn().mockReturnThis(),
  argMax: jest.fn().mockReturnThis(),
  mean: jest.fn().mockReturnThis(),
  concat: jest.fn().mockReturnThis(),
  expandDims: jest.fn().mockReturnThis(),
};

export const mockGraphModel = {
  inputs: [{ shape: [1, 640, 640, 3] }],
  execute: jest.fn().mockReturnValue(mockTensor),
  predict: jest.fn().mockReturnValue(mockTensor),
  dispose: jest.fn(),
};

export const createMockTensorFlow = () => ({
  loadGraphModel: jest.fn<() => Promise<typeof mockGraphModel>>().mockResolvedValue(mockGraphModel),
  browser: {
    fromPixels: jest.fn().mockReturnValue(mockTensor),
  },
  image: {
    resizeBilinear: jest.fn().mockReturnValue(mockTensor),
    nonMaxSuppressionAsync: jest.fn<() => Promise<typeof mockTensor>>().mockResolvedValue({
      ...mockTensor,
      data: jest.fn<() => Promise<Int32Array>>().mockResolvedValue(new Int32Array([0, 1, 2])),
    } as unknown as typeof mockTensor),
  },
  tidy: jest.fn((fn: () => unknown) => fn()),
  concat: jest.fn().mockReturnValue(mockTensor),
  dispose: jest.fn(),
});

export const setupTensorFlowMock = () => {
  const mockTf = createMockTensorFlow();
  jest.mock('@tensorflow/tfjs', () => mockTf);
  return mockTf;
};
