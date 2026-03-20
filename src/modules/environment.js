export function createEnvironmentModule(teamsSDK) {
  let _insideTeams = false;

  return {
    setInsideTeams(value) {
      _insideTeams = value;
    },

    isInsideTeams() {
      return _insideTeams;
    },

    isLikelyInsideTeams() {
      try {
        return (
          window.self !== window.top ||
          !!(window.nativeInterface) ||
          !!(window.TeamsJS)
        );
      } catch (e) {
        // Cross-origin iframe access throws — likely inside Teams
        return true;
      }
    },

    async getContext() {
      if (!_insideTeams || !teamsSDK || !teamsSDK.app ||
          typeof teamsSDK.app.getContext !== 'function') {
        return null;
      }
      return teamsSDK.app.getContext();
    },

    async getHostName() {
      if (!_insideTeams) return 'Browser';
      const ctx = await this.getContext();
      const hostName = ctx && ctx.app && ctx.app.host && ctx.app.host.name;
      return hostName || 'Teams';
    },
  };
}
