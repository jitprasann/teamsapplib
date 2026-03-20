export function createLifecycleModule(callbacks, teamsSDK) {
  return {
    init() {
      // onBeforeUnload — tells Teams desktop to CACHE the iframe instead of
      // destroying it. Prefer the newer registerBeforeSuspendOrTerminateHandler
      // (promise-based) and fall back to registerBeforeUnloadHandler (callback-based).
      try {
        if (typeof callbacks.onBeforeUnload === 'function' && teamsSDK.teamsCore) {
          if (typeof teamsSDK.teamsCore.registerBeforeSuspendOrTerminateHandler === 'function') {
            teamsSDK.teamsCore.registerBeforeSuspendOrTerminateHandler(() => {
              return new Promise((resolve) => {
                callbacks.onBeforeUnload(resolve);
              });
            });
          } else if (typeof teamsSDK.teamsCore.registerBeforeUnloadHandler === 'function') {
            teamsSDK.teamsCore.registerBeforeUnloadHandler((readyToUnload) => {
              callbacks.onBeforeUnload(readyToUnload);
              return true;
            });
          }
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
            teamsSDK.app.notifySuccess();
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
