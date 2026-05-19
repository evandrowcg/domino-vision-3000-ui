// @ts-nocheck
// Test utility - type checking disabled to avoid issues with jest mock types
import { jest } from '@jest/globals';

export const createMockMediaStream = () => {
  const mockTrack = {
    stop: vi.fn(),
    getCapabilities: vi.fn().mockReturnValue({}),
    applyConstraints: vi.fn().mockImplementation(() => Promise.resolve()),
    enabled: true,
    kind: 'video' as const,
    label: 'Mock Camera',
    id: 'mock-track-id',
  };

  return {
    getTracks: vi.fn().mockReturnValue([mockTrack]),
    getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
    getAudioTracks: vi.fn().mockReturnValue([]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
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
    mockStream.getVideoTracks()[0].getCapabilities = vi.fn().mockReturnValue({ torch: true });
  }

  return {
    getUserMedia: options.shouldFail
      ? vi.fn().mockImplementation(() =>
          Promise.reject(createDOMException(options.errorName || 'NotAllowedError', 'Permission denied'))
        )
      : vi.fn().mockImplementation(() =>
          Promise.resolve(mockStream as unknown as MediaStream)
        ),
    enumerateDevices: vi.fn().mockImplementation(() =>
      Promise.resolve([
        { deviceId: '1', groupId: '1', kind: 'videoinput', label: 'Camera 1', toJSON: () => ({}) },
      ] as MediaDeviceInfo[])
    ),
    getSupportedConstraints: vi.fn().mockReturnValue({
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
    play: vi.fn().mockImplementation(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn(),
    srcObject: null as MediaStream | null,
    videoWidth: 640,
    videoHeight: 480,
    clientWidth: 640,
    clientHeight: 480,
    readyState: 4,
    currentTime: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  return videoElement;
};
