import { PluginEventEmitter } from '../EventEmitter';

describe('PluginEventEmitter', () => {
  let emitter: PluginEventEmitter;
  
  beforeEach(() => {
    emitter = new PluginEventEmitter();
  });
  
  afterEach(() => {
    emitter.reset();
  });
  
  describe('Basic Event Handling', () => {
    test('should register and emit events', () => {
      const mockCallback = jest.fn();
      emitter.on('test', mockCallback);
      
      const results = emitter.emit('test', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
      expect(results).toHaveLength(1);
    });
    
    test('should handle multiple listeners for same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      emitter.on('test', callback1);
      emitter.on('test', callback2);
      
      emitter.emit('test', { data: 'test' });
      
      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });
    
    test('should handle once listeners', () => {
      const mockCallback = jest.fn();
      emitter.once('test', mockCallback);
      
      emitter.emit('test', { data: 'test1' });
      emitter.emit('test', { data: 'test2' });
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ data: 'test1' });
    });
    
    test('should remove listeners', () => {
      const mockCallback = jest.fn();
      emitter.on('test', mockCallback);
      
      emitter.off('test', mockCallback);
      emitter.emit('test', { data: 'test' });
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
    
    test('should handle any listeners', () => {
      const mockCallback = jest.fn();
      emitter.onAny(mockCallback);
      
      emitter.emit('event1', { data: 'test1' });
      emitter.emit('event2', { data: 'test2' });
      
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'event1',
          data: { data: 'test1' }
        })
      );
    });
  });
  
  describe('Event History', () => {
    test('should maintain event history', () => {
      emitter.emit('event1', { data: 'test1' });
      emitter.emit('event2', { data: 'test2' });
      
      const history = emitter.getEventHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('event1');
      expect(history[1].type).toBe('event2');
    });
    
    test('should limit event history size', () => {
      const limitedEmitter = new PluginEventEmitter(2);
      
      limitedEmitter.emit('event1', { data: 'test1' });
      limitedEmitter.emit('event2', { data: 'test2' });
      limitedEmitter.emit('event3', { data: 'test3' });
      
      const history = limitedEmitter.getEventHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('event2');
      expect(history[1].type).toBe('event3');
    });
    
    test('should clear event history', () => {
      emitter.emit('event1', { data: 'test1' });
      emitter.emit('event2', { data: 'test2' });
      
      emitter.clearHistory();
      
      const history = emitter.getEventHistory();
      expect(history).toHaveLength(0);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle errors in listeners gracefully', () => {
      const errorCallback = jest.fn();
      const successCallback = jest.fn();
      
      emitter.on('test', errorCallback.mockImplementation(() => {
        throw new Error('Test error');
      }));
      emitter.on('test', successCallback);
      
      // Should not throw error
      expect(() => {
        emitter.emit('test', { data: 'test' });
      }).not.toThrow();
      
      expect(errorCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
    });
    
    test('should handle errors in once listeners gracefully', () => {
      const errorCallback = jest.fn();
      
      emitter.once('test', errorCallback.mockImplementation(() => {
        throw new Error('Test error');
      }));
      
      // Should not throw error
      expect(() => {
        emitter.emit('test', { data: 'test' });
      }).not.toThrow();
      
      expect(errorCallback).toHaveBeenCalled();
    });
  });
  
  describe('Status and Metrics', () => {
    test('should get listener count for specific event', () => {
      emitter.on('test', jest.fn());
      emitter.on('test', jest.fn());
      emitter.on('other', jest.fn());
      
      expect(emitter.getListenerCount('test')).toBe(2);
      expect(emitter.getListenerCount('other')).toBe(1);
      expect(emitter.getListenerCount('nonexistent')).toBe(0);
    });
    
    test('should get total listener count', () => {
      emitter.on('test1', jest.fn());
      emitter.on('test1', jest.fn());
      emitter.on('test2', jest.fn());
      emitter.once('test3', jest.fn());
      emitter.onAny(jest.fn());
      
      expect(emitter.getTotalListenerCount()).toBe(5);
    });
    
    test('should get registered events', () => {
      emitter.on('event1', jest.fn());
      emitter.on('event2', jest.fn());
      emitter.once('event3', jest.fn());
      
      const events = emitter.getRegisteredEvents();
      
      expect(events).toContain('event1');
      expect(events).toContain('event2');
      expect(events).toContain('event3');
      expect(events).toHaveLength(3);
    });
    
    test('should get status', () => {
      emitter.on('test', jest.fn());
      emitter.emit('test', { data: 'test' });
      
      const status = emitter.getStatus();
      
      expect(status.listenersCount).toBe(1);
      expect(status.eventsEmitted).toBe(1);
      expect(status.eventHistorySize).toBe(1);
      expect(status.registeredEvents).toBe(1);
    });
  });
  
  describe('Debug Mode', () => {
    beforeEach(() => {
      // Enable debug mode
      process.env.HYBRID_DEBUG = 'true';
    });
    
    afterEach(() => {
      // Disable debug mode
      delete process.env.HYBRID_DEBUG;
    });
    
    test('should log debug messages in debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      emitter.on('test', jest.fn());
      emitter.emit('test', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventEmitter] 🎧 Listener registered for event: test')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EventEmitter] 📤 Event emitted: test')
      );
      
      consoleSpy.mockRestore();
    });
  });
});