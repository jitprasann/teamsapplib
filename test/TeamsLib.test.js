const teamsSDK = require('@microsoft/teams-js');
import { TeamsLib } from '../src/TeamsLib';

describe('TeamsLib', () => {
  beforeEach(() => {
    teamsSDK.__resetAllMocks();
    sessionStorage.clear();
  });

  describe('constructor', () => {
    test('creates instance without config', () => {
      const lib = new TeamsLib();
      expect(lib).toBeInstanceOf(TeamsLib);
    });
  });

  describe('init()', () => {
    test('initializes successfully inside Teams', async () => {
      const lib = new TeamsLib();
      await lib.init();
      expect(lib.isInsideTeams()).toBe(true);
      expect(teamsSDK.app.initialize).toHaveBeenCalled();
      expect(teamsSDK.app.getContext).toHaveBeenCalled();
    });

    test('sets theme from context (normalizes "default" to "light")', async () => {
      const lib = new TeamsLib();
      await lib.init();
      expect(lib.getTheme()).toBe('light');
    });

    test('registers theme change handler with SDK', async () => {
      const lib = new TeamsLib();
      await lib.init();
      expect(teamsSDK.app.registerOnThemeChangeHandler).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test('theme change handler updates theme and calls onThemeChange', async () => {
      const onThemeChange = jest.fn();
      const lib = new TeamsLib({ onThemeChange });
      await lib.init();

      // Simulate theme change from SDK
      const handler = teamsSDK.app.registerOnThemeChangeHandler.mock.calls[0][0];
      handler('dark');
      expect(lib.getTheme()).toBe('dark');
      expect(onThemeChange).toHaveBeenCalledWith('dark');
    });

    test('degrades gracefully outside Teams', async () => {
      teamsSDK.__simulateOutsideTeams();
      const lib = new TeamsLib();
      await lib.init();
      expect(lib.isInsideTeams()).toBe(false);
      expect(lib.getTheme()).toBeNull();
    });

    test('does not throw outside Teams', async () => {
      teamsSDK.__simulateOutsideTeams();
      const lib = new TeamsLib();
      await expect(lib.init()).resolves.toBe(lib);
    });

    test('returns the instance for chaining', async () => {
      const lib = new TeamsLib();
      const result = await lib.init();
      expect(result).toBe(lib);
    });

    test('init() is idempotent — second call is a no-op', async () => {
      const lib = new TeamsLib();
      await lib.init();
      await lib.init();
      expect(teamsSDK.app.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('environment', () => {
    test('getContext() returns Teams context after init', async () => {
      const lib = new TeamsLib();
      await lib.init();
      const ctx = lib.getContext();
      expect(ctx.app.appId).toBe('test-app-id');
    });

    test('getContext() returns null before init', () => {
      const lib = new TeamsLib();
      expect(lib.getContext()).toBeNull();
    });

    test('getHostName() returns host from context', async () => {
      const lib = new TeamsLib();
      await lib.init();
      expect(lib.getHostName()).toBe('Teams');
    });

    test('getHostName() returns "Browser" outside Teams', async () => {
      teamsSDK.__simulateOutsideTeams();
      const lib = new TeamsLib();
      await lib.init();
      expect(lib.getHostName()).toBe('Browser');
    });
  });

  describe('destroy()', () => {
    test('cleans up lifecycle listeners', async () => {
      const lib = new TeamsLib({ onThemeChange: jest.fn() });
      await lib.init();
      expect(() => lib.destroy()).not.toThrow();
    });
  });
});
