import { Elm327Adapter } from './elm327.adapter';
import { ConfigService } from '@nestjs/config';
import { ObdPid } from '../types/pid';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { ELM327_CONST } from './elm327.constants';

jest.mock('serialport');
jest.mock('@serialport/parser-readline');

describe('Elm327Adapter', () => {
  let adapter: Elm327Adapter;
  let mockConfig: Partial<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      get: jest.fn((key: string, fallback?: unknown) => fallback ?? 'true'),
    };

    adapter = new Elm327Adapter(mockConfig as ConfigService);
  });

  describe('readPid', () => {
    it('should throw when not connected', async () => {
      await expect(adapter.readPid(ObdPid.ENGINE_RPM)).rejects.toThrow(
        'ELM327 adapter is not connected',
      );
    });

    it('should return reading when connected and valid response', async () => {
      adapter.connected = true;
      adapter.sendCommandWithTimeout = jest.fn().mockResolvedValue('41 0C 01 00');

      const result = await adapter.readPid(ObdPid.ENGINE_RPM);

      expect(result.pid).toBe('0C');
      expect(result.name).toBe('rpm');
      expect(result.value).toBeDefined();
      expect(result.unit).toBe('rpm');
      expect(result.recordedAt).toBeInstanceOf(Date);
    });

    it('should retry on NO_DATA response', async () => {
      adapter.connected = true;
      const mockSendCommand = jest.fn()
        .mockResolvedValueOnce('NO DATA')
        .mockResolvedValueOnce('41 0C 01 00');
      adapter.sendCommandWithTimeout = mockSendCommand;

      const result = await adapter.readPid(ObdPid.ENGINE_RPM);

      expect(result.pid).toBe('0C');
      expect(mockSendCommand).toHaveBeenCalledTimes(2);
    });
  });

  describe('readPids', () => {
    it('should throw when not connected', async () => {
      await expect(adapter.readPids()).rejects.toThrow(
        'ELM327 adapter is not connected',
      );
    });

    it('should return readings for all PIDs', async () => {
      adapter.connected = true;
      const mockReadPid = jest.fn().mockResolvedValue({
        pid: '0C',
        name: 'rpm',
        value: 800,
        unit: 'rpm',
        recordedAt: new Date(),
      });
      adapter.readPid = mockReadPid;

      const result = await adapter.readPids(['0C', '0D']);

      expect(result).toHaveLength(2);
      expect(mockReadPid).toHaveBeenCalledTimes(2);
    });

    it('should continue on individual PID failure', async () => {
      adapter.connected = true;
      const mockReadPid = jest.fn()
        .mockRejectedValueOnce(new Error('PID 0C failed'))
        .mockResolvedValueOnce({
          pid: '0D',
          name: 'speed',
          value: 45,
          unit: 'km/h',
          recordedAt: new Date(),
        });
      adapter.readPid = mockReadPid;

      const result = await adapter.readPids(['0C', '0D']);

      expect(result).toHaveLength(1);
      expect(result[0].pid).toBe('0D');
    });
  });

  describe('disconnect', () => {
    it('should resolve without error when not connected', async () => {
      await expect(adapter.disconnect()).resolves.toBeUndefined();
    });

    it('should close port and clear state', async () => {
      adapter.connected = true;
      adapter.port = {
        isOpen: true,
        close: jest.fn((cb?: (err?: Error | null) => void) => {
          process.nextTick(() => cb?.(null));
        }),
        removeAllListeners: jest.fn(),
      } as unknown as SerialPort;
      adapter.parser = {
        removeAllListeners: jest.fn(),
      } as unknown as ReadlineParser;

      await adapter.disconnect();

      expect(adapter.isConnected()).toBe(false);
      expect(adapter.port).toBeNull();
      expect(adapter.parser).toBeNull();
    });
  });

  describe('connect', () => {
    it('should throw when OBD_SERIAL_PORT is not configured', async () => {
      mockConfig.get = jest.fn().mockReturnValue(undefined);
      await expect(adapter.connect()).rejects.toThrow(
        'OBD_SERIAL_PORT is not configured',
      );
    });
  });

  describe('isConnected', () => {
    it('should return false initially', () => {
      expect(adapter.isConnected()).toBe(false);
    });

    it('should return true when connected', () => {
      adapter.connected = true;
      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('detectProtocol', () => {
    it('should detect protocol from valid response', async () => {
      adapter.sendCommand = jest.fn().mockResolvedValue('41 00 BE 1F A8 13');
      adapter.isValidProtocolResponse = jest.fn().mockReturnValue(true);

      await adapter.detectProtocol();

      expect(adapter.protocol).toBe('auto');
    });

    it('should fall back to auto when no protocol matches', async () => {
      const mockSendCommand = jest.fn((cmd: string) => {
        if (cmd === ELM327_CONST.CMD_RESET) {
          return Promise.resolve('OK');
        }
        return Promise.reject(new Error('no response'));
      });
      adapter.sendCommand = mockSendCommand;

      await adapter.detectProtocol();

      expect(adapter.protocol).toBe('auto');
    });
  });

  describe('isValidProtocolResponse', () => {
    it('should return false for empty response', () => {
      expect(adapter.isValidProtocolResponse('')).toBe(false);
    });

    it('should return false for ERROR response', () => {
      expect(adapter.isValidProtocolResponse('ERROR')).toBe(false);
    });

    it('should return false for UNABLE response', () => {
      expect(adapter.isValidProtocolResponse('UNABLE 01')).toBe(false);
    });

    it('should return false for STOPPED response', () => {
      expect(adapter.isValidProtocolResponse('STOPPED 01')).toBe(false);
    });

    it('should return true for valid hex response', () => {
      expect(adapter.isValidProtocolResponse('41 0C 01 00')).toBe(true);
    });

    it('should return false for invalid hex response', () => {
      expect(adapter.isValidProtocolResponse('NOT HEX')).toBe(false);
    });
  });

  describe('sendCommandWithTimeout', () => {
    it('should reject when not connected', async () => {
      await expect(adapter.sendCommandWithTimeout('ATZ', 1000)).rejects.toThrow(
        'Not connected',
      );
    });

    it('should resolve with buffer when prompt received', async () => {
      adapter.connected = true;
      adapter.parser = new (require('events').EventEmitter)();
      adapter.port = { write: jest.fn() } as unknown as SerialPort;

      const promise = adapter.sendCommandWithTimeout('ATZ', 1000);
      adapter.parser?.emit('data', '>');

      await expect(promise).resolves.toBe('');
    });

    it('should reject on timeout', async () => {
      adapter.connected = true;
      adapter.parser = new (require('events').EventEmitter)();
      adapter.port = { write: jest.fn() } as unknown as SerialPort;

      const promise = adapter.sendCommandWithTimeout('ATZ', 50);
      await expect(promise).rejects.toThrow('timeout after');
    });

    it('should reject on ELM327 error response', async () => {
      adapter.connected = true;
      adapter.parser = new (require('events').EventEmitter)();
      adapter.port = { write: jest.fn() } as unknown as SerialPort;

      const promise = adapter.sendCommandWithTimeout('ATZ', 1000);
      adapter.parser?.emit('data', 'ERROR');

      await expect(promise).rejects.toThrow('ELM327 error');
    });
  });

  describe('attemptReconnect', () => {
    it('should be a function', () => {
      expect(typeof adapter.attemptReconnect).toBe('function');
    });
  });

  describe('convertPidValue', () => {
    it('should convert RPM correctly', () => {
      const result = adapter.convertPidValue(ObdPid.ENGINE_RPM, ['01', '00']);
      expect(result).toBe((1 * 256 + 0) / 4);
    });

    it('should convert speed correctly', () => {
      const result = adapter.convertPidValue(ObdPid.VEHICLE_SPEED, ['30', '00']);
      expect(result).toBe(48);
    });

    it('should convert coolant temp correctly', () => {
      const result = adapter.convertPidValue(ObdPid.COOLANT_TEMP, ['35', '00']);
      expect(result).toBe(13);
    });

    it('should convert throttle correctly', () => {
      const result = adapter.convertPidValue(ObdPid.THROTTLE_POSITION, ['80', '00']);
      expect(result).toBe((128 * 100) / 255);
    });
  });
});