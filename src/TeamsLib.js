import { createEnvironmentModule } from './modules/environment';
import { createThemeModule } from './modules/theme';
import { createLifecycleModule } from './modules/lifecycle';
import { createDeeplinkModule } from './modules/deeplink';

let teamsSDK;
try {
  teamsSDK = require('@microsoft/teams-js');
} catch (e) {
  teamsSDK = null;
}

let _instance = null;

export class TeamsLib {
  constructor(config = {}) {
    this._config = config;
    this._initialized = false;

    this._environment = createEnvironmentModule(teamsSDK);
    this._theme = createThemeModule(config, this._environment);
    this._lifecycle = createLifecycleModule(config, teamsSDK || {});
    this._deeplink = createDeeplinkModule(this._environment, teamsSDK || {});
  }

  static getInstance(config) {
    if (!_instance) {
      _instance = new TeamsLib(config);
    }
    return _instance;
  }

  async init() {
    if (this._initialized) return this;

    try {
      if (!teamsSDK) {
        throw new Error('@microsoft/teams-js not available');
      }

      await teamsSDK.app.initialize();
      this._environment.setInsideTeams(true);

      if (typeof teamsSDK.app.registerOnThemeChangeHandler === 'function') {
        teamsSDK.app.registerOnThemeChangeHandler((rawTheme) => {
          this._theme.handleChange(rawTheme);
        });
      }

      this._lifecycle.init();
      teamsSDK.app.notifySuccess();
    } catch (e) {
      this._environment.setInsideTeams(false);
    }

    this._initialized = true;
    return this;
  }

  isInsideTeams() {
    return this._environment.isInsideTeams();
  }

  isLikelyInsideTeams() {
    return this._environment.isLikelyInsideTeams();
  }

  async getContext() {
    return this._environment.getContext();
  }

  async getHostName() {
    return this._environment.getHostName();
  }

  async getTheme() {
    return this._theme.getCurrent();
  }

  async shareDeeplink(urlOrOptions) {
    return this._deeplink.share(urlOrOptions);
  }

  destroy() {
    this._lifecycle.destroy();
  }
}
