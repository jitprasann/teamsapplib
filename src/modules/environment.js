export function createEnvironmentModule() {
  let _insideTeams = false;
  let _context = null;

  return {
    setInsideTeams(value) {
      _insideTeams = value;
    },

    setContext(context) {
      _context = context;
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

    getContext() {
      return _context;
    },

    getHostName() {
      if (!_context) return 'Browser';
      const hostName = _context.app && _context.app.host && _context.app.host.name;
      if (hostName) return hostName;
      return _insideTeams ? 'Teams' : 'Browser';
    },
  };
}
