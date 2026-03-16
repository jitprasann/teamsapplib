const STORAGE_KEY = '@microsoftlib/teams:appState';

export function createStateModule(config = {}) {
  const persistAcrossSessions = config.persistAcrossSessions || false;

  function getStorage() {
    return persistAcrossSessions ? localStorage : sessionStorage;
  }

  return {
    save(stateObj) {
      try {
        getStorage().setItem(STORAGE_KEY, JSON.stringify(stateObj));
      } catch (e) {
        // Storage full or unavailable — fail silently
      }
    },

    get() {
      try {
        const raw = getStorage().getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    clear() {
      try {
        getStorage().removeItem(STORAGE_KEY);
      } catch (e) {
        // fail silently
      }
    },
  };
}
