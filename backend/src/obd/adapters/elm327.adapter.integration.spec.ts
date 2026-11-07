import { Elm327Adapter } from './elm327.adapter';
import { ConfigService } from '@nestjs/config';
import { ObdPid } from '../types/pid';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

jest.mock('serialport');
jest.mock('@serialport/parser-readline');

describe('Elm327Adapter Integration', () => {
  let adapter: Elm327Adapter;
  let mockConfig: Partial<ConfigService>;
  let mockPort: any;
  let mockParser: any;

  const mockConfigGet = jest.fn((key: string, fallback?: unknown) => {
    if (key === 'OBD_SERIAL_PORT') return 'COM3';
    return fallback ?? 'true';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      get: mockConfigGet,
    };

    mockPort = {
      path: 'COM3',
      baudRate: 38400,
      autoOpen: false,
      lock: false,
      isOpen: true,
      open: jest.fn((cb?: (err?: Error | null) => void) => {
        mockPort.isOpen = true;
        process.nextTick(() => cb?.(null));
      }),
      close: jest.fn((cb?: (err?: Error | null) => void) => {
        mockPort.isOpen = false;
        process.nextTick(() => cb?.(null));
      }),
      write: jest.fn((data: string, cb?: (err?: Error | null) => void) => {
        process.nextTick(() => cb?.(null));
      }),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
      emit: jest.fn(),
      removeListener: jest.fn(),
    };

    mockParser = new (require('events').EventEmitter)() as any;
    mockParser.removeAllListeners = jest.fn();
    mockParser.removeListener = jest.fn();

    (SerialPort as unknown as jest.Mock).mockImplementation(() => mockPort);
    (ReadlineParser as unknown as jest.Mock).mockImplementation(() => mockParser);

    adapter = new Elm327Adapter(mockConfig as ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Full lifecycle integration', () => {
    it('should connect, detect protocol, read PID, and disconnect', async () => {
      mockPort.isOpen = true;

      adapter.connected = true;
      adapter.protocol = 'auto';
      adapter.port = mockPort;
      adapter.parser = mockParser;

      const sendPromise = adapter.readPid(ObdPid.ENGINE_RPM);

      mockParser.emit('data', '010C');
      mockParser.emit('data', '41 0C 01 00');
      mockParser.emit('data', '>');

      const result = await sendPromise;

      expect(result.pid).toBe('0C');
      expect(result.name).toBe('rpm');
      expect(result.value).toBe(64);
      expect(result.unit).toBe('rpm');
      expect(result.recordedAt).toBeInstanceOf(Date);
    }, 10000);

    it('should handle full disconnect flow', async () => {
      mockPort.isOpen = true;
      adapter.connected = true;
      adapter.port = mockPort;
      adapter.parser = mockParser;

      await adapter.disconnect();

      expect(adapter.isConnected()).toBe(false);
      expect(mockParser.removeAllListeners).toHaveBeenCalledWith('data');
      expect(mockPort.close).toHaveBeenCalled();
      expect(adapter.port).toBeNull();
      expect(adapter.parser).toBeNull();
    });
  });

  describe('readPid integration with mocked serial port', () => {
    beforeEach(() => {
      adapter.connected = true;
      adapter.port = mockPort;
      adapter.parser = mockParser;
    });

    it('should read PID through real serial data flow', async () => {
      const sendPromise = adapter.readPid(ObdPid.VEHICLE_SPEED);

      mockParser.emit('data', '010D');
      mockParser.emit('data', '41 0D 30 00');
      mockParser.emit('data', '>');

      const result = await sendPromise;

      expect(result.pid).toBe('0D');
      expect(result.name).toBe('speed');
      expect(result.value).toBe(48);
      expect(result.unit).toBe('km/h');
    }, 10000);
  });
});
