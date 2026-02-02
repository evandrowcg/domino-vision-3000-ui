// @ts-nocheck
// Test utility - type checking disabled to avoid issues with jest mock types
import { jest } from '@jest/globals';

export const createMockMediaStream = () => {
  const mockTrack = {
    stop: jest.fn(),
    getCapabilities: jest.fn().mockReturnValue({}),
    applyConstraints: jest.fn().mockImplementation(() => Promise.resolve()),
    enabled: true,
    kind: 'video' as const,
    label: 'Mock Camera',
    id: 'mock-track-id',
  };

  return {
    getTracks: jest.fn().mockReturnValue([mockTrack]),
    getVideoTracks: jest.fn().mockReturnValue([mockTrack]),
    getAudioTracks: jest.fn().mockReturnValue([]),
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
    active: true,
  };
};

// Helper to create a DOMException-like error
const createDOMException = (name: string, message: string) => {
  const error = new DOMException(message, name);
  return error;
};

export const createMockMediaDevices = (options: {
  shouldFail?: boolean;
  errorName?: string;
  supportsTorch?: boolean;
} = {}) => {
  const mockStream = createMockMediaStream();

  if (options.supportsTorch) {
    mockStream.getVideoTracks()[0].getCapabilities = jest.fn().mockReturnValue({ torch: true });
  }

  return {
    getUserMedia: options.shouldFail
      ? jest.fn().mockImplementation(() =>
          Promise.reject(createDOMException(options.errorName || 'NotAllowedError', 'Permission denied'))
        )
      : jest.fn().mockImplementation(() =>
          Promise.resolve(mockStream as unknown as MediaStream)
        ),
    enumerateDevices: jest.fn().mockImplementation(() =>
      Promise.resolve([
        { deviceId: '1', groupId: '1', kind: 'videoinput', label: 'Camera 1', toJSON: () => ({}) },
      ] as MediaDeviceInfo[])
    ),
    getSupportedConstraints: jest.fn().mockReturnValue({
      width: true,
      height: true,
      facingMode: true,
    }),
  };
};

export const setupMediaDevicesMock = (options: Parameters<typeof createMockMediaDevices>[0] = {}) => {
  const mockMediaDevices = createMockMediaDevices(options);

  Object.defineProperty(navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true,
    configurable: true,
  });

  return mockMediaDevices;
};

export const createMockVideoElement = () => {
  const videoElement = {
    play: jest.fn().mockImplementation(() => Promise.resolve()),
    pause: jest.fn(),
    load: jest.fn(),
    srcObject: null as MediaStream | null,
    videoWidth: 640,
    videoHeight: 480,
    clientWidth: 640,
    clientHeight: 480,
    readyState: 4,
    currentTime: 0,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  return videoElement;
};
