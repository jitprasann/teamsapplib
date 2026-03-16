export function createLifecycleModule(callbacks, teamsSDK) {
  return {
    init() {
      // onBeforeUnload — registers registerBeforeUnloadHandler with Teams.
      // This tells Teams desktop to CACHE the iframe instead of destroying it.
      // Only register if the caller provides this callback.
      try {
        if (typeof callbacks.onBeforeUnload === 'function' &&
            teamsSDK.teamsCore &&
            typeof teamsSDK.teamsCore.registerBeforeUnloadHandler === 'function') {
          teamsSDK.teamsCore.registerBeforeUnloadHandler((readyToUnload) => {
            callbacks.onBeforeUnload(readyToUnload);
          });
        }
      } catch (e) {
        // Not supported — skip
      }

      // onResume — fires when user returns to a cached iframe.
      // Only useful when onBeforeUnload is also registered (it enables caching).
      try {
        if (typeof callbacks.onResume === 'function' &&
            teamsSDK.app && teamsSDK.app.lifecycle &&
            typeof teamsSDK.app.lifecycle.registerOnResumeHandler === 'function') {
          teamsSDK.app.lifecycle.registerOnResumeHandler(() => {
            callbacks.onResume();
          });
        }
      } catch (e) {
        // Not supported — skip
      }

      // onFocusEnter — fires when keyboard focus enters the tab.
      try {
        if (typeof callbacks.onFocusEnter === 'function' &&
            teamsSDK.pages &&
            typeof teamsSDK.pages.registerFocusEnterHandler === 'function') {
          teamsSDK.pages.registerFocusEnterHandler((focusEnterInfo) => {
            callbacks.onFocusEnter(focusEnterInfo);
          });
        }
      } catch (e) {
        // Not supported — skip
      }
    },

    destroy() {
      // SDK handlers are cleaned up by Teams when the iframe is destroyed.
      // Nothing to manually remove.
    },
  };
}
