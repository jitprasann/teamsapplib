function normalizeTheme(raw) {
  if (raw === 'default') return 'light';
  return raw;
}

export function createThemeModule(callbacks) {
  let _currentTheme = null;

  return {
    init(rawTheme) {
      if (rawTheme) {
        _currentTheme = normalizeTheme(rawTheme);
      }
    },

    getCurrent() {
      return _currentTheme;
    },

    handleChange(rawTheme) {
      const theme = normalizeTheme(rawTheme);
      _currentTheme = theme;
      if (typeof callbacks.onThemeChange === 'function') {
        callbacks.onThemeChange(theme);
      }
    },
  };
}
