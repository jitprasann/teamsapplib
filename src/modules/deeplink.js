const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createDeeplinkModule(environmentModule, teamsSDK) {
  return {
    /**
     * Opens a Microsoft Teams deeplink. Detects the environment and handles
     * navigation automatically — SDK APIs inside Teams, `window.open()` outside.
     *
     * Accepts a URL string or an options object. Always returns the deeplink URL.
     *
     * @param {string|Object} deeplinkOrOptions - A deeplink URL string, or an options object.
     * @param {string} [deeplinkOrOptions.appId] - Teams app ID (UUID format, e.g. '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d'). Falls back to app ID from Teams context.
     * @param {string} [deeplinkOrOptions.tabId] - Tab (page) ID. Omit for app-level links.
     * @param {Object} [deeplinkOrOptions.context] - Context / subEntity payload passed to the app.
     * @param {string} [deeplinkOrOptions.message] - Text message shown to the user when the deeplink is opened.
     * @param {string} [deeplinkOrOptions.webUrl] - Fallback web URL when Teams is not available.
     * @param {string} [deeplinkOrOptions.label] - Display label for the link.
     * @returns {Promise<string>} The deeplink URL.
     *
     * @example
     * // App-level link
     * var url = await open({ appId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d' });
     *
     * @example
     * // With message
     * var url = await open({ appId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', message: 'Open order #42' });
     *
     * @example
     * // Tab-level with context and message
     * var url = await open({ appId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', tabId: 'dashboard', context: { subEntityId: 'item-1' }, message: 'View item' });
     */
    async open(deeplinkOrOptions) {
      const insideTeams = environmentModule.isInsideTeams();

      // URL string path
      if (typeof deeplinkOrOptions === 'string') {
        const url = deeplinkOrOptions;
        if (insideTeams && teamsSDK.app && typeof teamsSDK.app.openLink === 'function') {
          await teamsSDK.app.openLink(url);
        } else {
          window.open(url, '_blank');
        }
        return url;
      }

      // Options object path — build URL
      const { tabId, context, appId, message, webUrl, label } = deeplinkOrOptions;
      const resolvedAppId = appId || _getAppIdFromContext();
      if (!resolvedAppId) {
        throw new Error('appId is required — provide it directly or initialize TeamsLib first');
      }
      if (!UUID_REGEX.test(resolvedAppId)) {
        throw new Error('appId must be a valid UUID (e.g. "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d")');
      }

      const contextParam = context ? encodeURIComponent(JSON.stringify(context)) : '';
      let url = `https://teams.microsoft.com/l/entity/${resolvedAppId}`;

      if (tabId) {
        url += `/${tabId}`;
      }

      const params = [];
      if (contextParam) params.push(`context=${contextParam}`);
      if (message) params.push(`message=${encodeURIComponent(message)}`);
      if (webUrl) params.push(`webUrl=${encodeURIComponent(webUrl)}`);
      if (label) params.push(`label=${encodeURIComponent(label)}`);

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      // Navigate
      if (insideTeams && teamsSDK.pages && typeof teamsSDK.pages.navigateToApp === 'function') {
        const navParams = { appId: resolvedAppId };
        if (tabId) {
          navParams.pageId = tabId;
        }
        if (context) {
          navParams.subPageId = JSON.stringify(context);
        }
        await teamsSDK.pages.navigateToApp(navParams);
      } else {
        window.open(url, '_blank');
      }

      return url;
    },
  };

  function _getAppIdFromContext() {
    const ctx = environmentModule.getContext();
    if (ctx && ctx.app && ctx.app.appId) return ctx.app.appId;
    return null;
  }
}
