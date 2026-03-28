const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createDeeplinkModule(environmentModule, teamsSDK) {
  function _buildDeeplinkUrl(appId, { tabId, context, message, webUrl, label } = {}) {
    if (!appId) {
      throw new Error('appId is required — provide it directly or initialize TeamsLib first');
    }
    if (!UUID_REGEX.test(appId)) {
      throw new Error('appId must be a valid UUID (e.g. "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d")');
    }

    const contextParam = context ? encodeURIComponent(JSON.stringify(context)) : '';
    let url = `https://teams.microsoft.com/l/entity/${appId}`;

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

    return url;
  }

  return {
    async share(urlOrOptions) {
      let url, text, message, preview;

      if (typeof urlOrOptions === 'string') {
        url = urlOrOptions;
      } else {
        ({ text, message, preview } = urlOrOptions);
        if (urlOrOptions.url) {
          url = urlOrOptions.url;
        } else if (urlOrOptions.appId) {
          const { appId, tabId, context, webUrl, label } = urlOrOptions;
          url = _buildDeeplinkUrl(appId, { tabId, context, message, webUrl, label });
        }
      }

      const insideTeams = environmentModule.isInsideTeams();

      if (insideTeams && teamsSDK.sharing && typeof teamsSDK.sharing.shareWebContent === 'function') {
        try {
          const contentItems = [];

          if (url) {
            const urlContent = { type: 'URL', url };
            if (message) urlContent.message = message;
            if (preview !== undefined) urlContent.preview = preview;
            contentItems.push(urlContent);
          }

          if (text) {
            contentItems.push({ type: 'text', text });
          }

          if (contentItems.length === 0) {
            return { shared: false };
          }

          await teamsSDK.sharing.shareWebContent({ content: contentItems });
          return { shared: true, url, text };
        } catch (e) {
          return { shared: false, url, text };
        }
      }

      if (navigator.share) {
        try {
          const shareData = {};
          if (url) shareData.url = url;
          if (text) shareData.text = text;
          else if (message) shareData.text = message;

          await navigator.share(shareData);
          return { shared: true, url, text };
        } catch (e) {
          return { shared: false, url, text };
        }
      }

      if (url) {
        window.open(url, '_blank');
        return { shared: true, url, text };
      }

      return { shared: false, text };
    },
  };
}
