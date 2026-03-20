import { createEnvironmentModule } from './modules/environment';
import { createThemeModule } from './modules/theme';
import { createLifecycleModule } from './modules/lifecycle';
import { createDeeplinkModule } from './modules/deeplink';
import { createStateModule } from './modules/state';

let teamsSDK;
try {
  teamsSDK = require('@microsoft/teams-js');
} catch (e) {
  teamsSDK = null;
}

let _instance = null;

export class TeamsLib {
  /**
   * Creates a new TeamsLib instance.
   *
   * @param {Object} [config] - Configuration options.
   * @param {function} [config.onThemeChange] - Called when theme changes. Receives theme name.
   * @param {function} [config.onBeforeUnload] - Called before tab unloads (Teams only). Enables iframe caching. Receives readyToUnload callback.
   * @param {function} [config.onResume] - Called when user returns to cached iframe (Teams only). Pair with onBeforeUnload.
   * @param {function} [config.onFocusEnter] - Called when focus enters tab (Teams only). Receives focus info.
   * @param {Object} [config.state] - State module options.
   * @param {boolean} [config.state.persistAcrossSessions] - Use localStorage instead of sessionStorage.
   */
  constructor(config = {}) {
    this._config = config;
    this._initialized = false;

    // Create modules — pass config callbacks directly
    this._environment = createEnvironmentModule();
    this._theme = createThemeModule(config);
    this._lifecycle = createLifecycleModule(config, teamsSDK || {});
    this._deeplink = createDeeplinkModule(this._environment, teamsSDK || {});
    this._state = createStateModule(config.state || {});
  }

  /**
   * Returns the singleton instance. Creates one on the first call using the
   * provided config; subsequent calls return the same instance (config ignored).
   *
   * @param {Object} [config] - Configuration options (same as constructor).
   * @returns {TeamsLib}
   */
  static getInstance(config) {
    if (!_instance) {
      _instance = new TeamsLib(config);
    }
    return _instance;
  }

  /**
   * Initializes the Teams SDK. Detects environment, loads context, sets theme.
   * If already initialized, returns immediately — safe to call from multiple places.
   *
   * @returns {Promise<TeamsLib>} The instance (for chaining).
   */
  async init() {
    if (this._initialized) return this;

    try {
      if (!teamsSDK) {
        throw new Error('@microsoft/teams-js not available');
      }

      await teamsSDK.app.initialize();
      this._environment.setInsideTeams(true);

      const context = await teamsSDK.app.getContext();
      this._environment.setContext(context);

      // Initialize theme from context
      const rawTheme = context.app && context.app.theme;
      this._theme.init(rawTheme);

      // Register SDK theme change handler
      teamsSDK.app.registerOnThemeChangeHandler((rawTheme) => {
        this._theme.handleChange(rawTheme);
      });

      // Register lifecycle handlers after SDK is initialized
      this._lifecycle.init();

      // Tell Teams the app loaded successfully
      teamsSDK.app.notifySuccess();
    } catch (e) {
      // Not inside Teams or SDK unavailable — degrade gracefully
      this._environment.setInsideTeams(false);
    }

    this._initialized = true;
    return this;
  }

  // Environment

  /**
   * Returns true if running inside Microsoft Teams.
   * @returns {boolean}
   */
  isInsideTeams() {
    return this._environment.isInsideTeams();
  }

  /**
   * Quick guess — checks iframe, nativeInterface, TeamsJS global. Works before init().
   * @returns {boolean}
   */
  isLikelyInsideTeams() {
    return this._environment.isLikelyInsideTeams();
  }

  /**
   * Returns the Teams context object, or null outside Teams.
   * @returns {Object|null}
   */
  getContext() {
    return this._environment.getContext();
  }

  /**
   * Returns the host name — 'Teams', host name from context, or 'Browser'.
   * @returns {string}
   */
  getHostName() {
    return this._environment.getHostName();
  }

  // Theme

  /**
   * Returns current theme: 'light', 'dark', 'contrast', or null.
   * @returns {string|null}
   */
  getTheme() {
    return this._theme.getCurrent();
  }

  // Deeplink

  /**
   * Opens a Microsoft Teams deeplink. Detects the environment and navigates
   * automatically — SDK APIs inside Teams, window.open() outside.
   *
   * Accepts a URL string or an options object. Always returns the deeplink URL.
   *
   * @param {string|Object} deeplinkOrOptions - A deeplink URL string, or an options object.
   * @param {string} [deeplinkOrOptions.appId] - Teams app ID (UUID format). Defaults to app ID from Teams context.
   * @param {string} [deeplinkOrOptions.tabId] - Tab (page) ID. Omit for app-level links.
   * @param {Object} [deeplinkOrOptions.context] - Context / subEntity payload.
   * @param {string} [deeplinkOrOptions.message] - Text message shown when the deeplink is opened.
   * @param {string} [deeplinkOrOptions.webUrl] - Fallback web URL.
   * @param {string} [deeplinkOrOptions.label] - Display label.
   * @returns {Promise<string>} The deeplink URL.
   *
   * @example
   * // App-level
   * var url = await lib.openDeeplink({ appId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' });
   *
   * @example
   * // With message
   * var url = await lib.openDeeplink({ appId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', message: 'Open order #42' });
   *
   * @example
   * // Tab-level with context
   * var url = await lib.openDeeplink({ tabId: 'dash', appId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', context: { subEntityId: 'r-42' } });
   *
   * @example
   * // By URL string
   * var url = await lib.openDeeplink('https://teams.microsoft.com/l/entity/1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d');
   */
  async openDeeplink(deeplinkOrOptions) {
    return this._deeplink.open(deeplinkOrOptions);
  }

  /**
   * Shares a Microsoft Teams deeplink. Inside Teams, opens the native share
   * dialog. Outside Teams, falls back to window.open().
   *
   * Returns `{ shared, url }` — `shared` is false if the user cancelled or
   * an error occurred during sharing.
   *
   * @param {Object} options - Share options.
   * @param {string} options.appId - Teams app ID (UUID format). Always required.
   * @param {string} [options.tabId] - Tab (page) ID.
   * @param {Object} [options.context] - Context / subEntity payload.
   * @param {string} [options.message] - Text shown in the share dialog.
   * @param {string} [options.webUrl] - Fallback web URL.
   * @param {string} [options.label] - Display label.
   * @param {boolean} [options.preview] - Show link preview (Teams only).
   * @returns {Promise<{shared: boolean, url: string}>}
   *
   * @example
   * var result = await lib.shareDeeplink({ appId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' });
   * if (result.shared) { console.log('Shared:', result.url); }
   *
   * @example
   * var result = await lib.shareDeeplink({
   *   appId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
   *   tabId: 'dashboard',
   *   context: { subEntityId: 'item-1' },
   *   message: 'Check this out!'
   * });
   */
  async shareDeeplink(options) {
    return this._deeplink.share(options);
  }

  // State

  /**
   * Saves state to sessionStorage (or localStorage if persistAcrossSessions is true).
   * @param {Object} stateObj - Any JSON-serializable object.
   */
  saveState(stateObj) {
    this._state.save(stateObj);
  }

  /**
   * Returns saved state, or null if nothing saved.
   * @returns {Object|null}
   */
  getState() {
    return this._state.get();
  }

  /**
   * Removes saved state.
   */
  clearState() {
    this._state.clear();
  }

  // Cleanup

  /**
   * Removes lifecycle listeners. Call when done.
   */
  destroy() {
    this._lifecycle.destroy();
  }
}
