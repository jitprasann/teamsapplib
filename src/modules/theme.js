function normalizeTheme(raw) {
  if (raw === 'default') return 'light';
  return raw;
}

function detectBrowserTheme() {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    if (window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches) {
      return 'contrast';
    }
  } catch (e) {
    // matchMedia not available
  }
  return 'light';
}

export function createThemeModule(callbacks, environmentModule) {
  return {
    init() {
      // no-op — theme is read live, not cached
    },

    async getCurrent() {
      const ctx = await environmentModule.getContext();
      if (ctx && ctx.app && ctx.app.theme) {
        return normalizeTheme(ctx.app.theme);
      }
      return detectBrowserTheme();
    },

    handleChange(rawTheme) {
      const theme = normalizeTheme(rawTheme);
      if (typeof callbacks.onThemeChange === 'function') {
        callbacks.onThemeChange(theme);
      }
    },
  };
}
