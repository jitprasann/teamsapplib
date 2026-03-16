import { createLifecycleModule } from '../../src/modules/lifecycle';

describe('lifecycle module', () => {
  let mockSDK;

  beforeEach(() => {
    mockSDK = {
      app: {
        lifecycle: {
          registerOnResumeHandler: jest.fn(),
        },
      },
      teamsCore: {
        registerBeforeUnloadHandler: jest.fn(),
      },
      pages: {
        registerFocusEnterHandler: jest.fn(),
      },
    };
  });

  describe('opt-in behavior — hooks only register when callback provided', () => {
    test('no callbacks = no SDK handlers registered', () => {
      const lifecycle = createLifecycleModule({}, mockSDK);
      lifecycle.init();
      expect(mockSDK.app.lifecycle.registerOnResumeHandler).not.toHaveBeenCalled();
      expect(mockSDK.teamsCore.registerBeforeUnloadHandler).not.toHaveBeenCalled();
      expect(mockSDK.pages.registerFocusEnterHandler).not.toHaveBeenCalled();
    });

    test('onBeforeUnload registers registerBeforeUnloadHandler', () => {
      const lifecycle = createLifecycleModule({ onBeforeUnload: jest.fn() }, mockSDK);
      lifecycle.init();
      expect(mockSDK.teamsCore.registerBeforeUnloadHandler).toHaveBeenCalled();
      expect(mockSDK.app.lifecycle.registerOnResumeHandler).not.toHaveBeenCalled();
    });

    test('onResume registers registerOnResumeHandler', () => {
      const lifecycle = createLifecycleModule({ onResume: jest.fn() }, mockSDK);
      lifecycle.init();
      expect(mockSDK.app.lifecycle.registerOnResumeHandler).toHaveBeenCalled();
      expect(mockSDK.teamsCore.registerBeforeUnloadHandler).not.toHaveBeenCalled();
    });

    test('onFocusEnter registers registerFocusEnterHandler', () => {
      const lifecycle = createLifecycleModule({ onFocusEnter: jest.fn() }, mockSDK);
      lifecycle.init();
      expect(mockSDK.pages.registerFocusEnterHandler).toHaveBeenCalled();
    });
  });

  describe('callback invocation', () => {
    test('onBeforeUnload called with readyToUnload', () => {
      const onBeforeUnload = jest.fn();
      const lifecycle = createLifecycleModule({ onBeforeUnload }, mockSDK);
      lifecycle.init();
      const callback = mockSDK.teamsCore.registerBeforeUnloadHandler.mock.calls[0][0];
      const readyToUnload = jest.fn();
      callback(readyToUnload);
      expect(onBeforeUnload).toHaveBeenCalledWith(readyToUnload);
    });

    test('onResume called when resume handler fires', () => {
      const onResume = jest.fn();
      const lifecycle = createLifecycleModule({ onResume }, mockSDK);
      lifecycle.init();
      const resumeCallback = mockSDK.app.lifecycle.registerOnResumeHandler.mock.calls[0][0];
      resumeCallback();
      expect(onResume).toHaveBeenCalled();
    });

    test('onFocusEnter called with focus info', () => {
      const onFocusEnter = jest.fn();
      const lifecycle = createLifecycleModule({ onFocusEnter }, mockSDK);
      lifecycle.init();
      const callback = mockSDK.pages.registerFocusEnterHandler.mock.calls[0][0];
      callback({ origin: 'previous' });
      expect(onFocusEnter).toHaveBeenCalledWith({ origin: 'previous' });
    });
  });

  describe('graceful degradation', () => {
    test('works when SDK lifecycle handlers not available', () => {
      const callbacks = { onResume: jest.fn(), onBeforeUnload: jest.fn() };
      const lc = createLifecycleModule(callbacks, {});
      expect(() => lc.init()).not.toThrow();
    });
  });
});
