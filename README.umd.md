# @microsoftlib/teams — UMD Usage

How to use this library with a `<script>` tag or RequireJS (no bundler needed).

---

## Script Tag

Load the Teams SDK and this library with script tags. The library is available as `MicrosoftlibTeams` on `window`.

```html
<script src="https://res.cdn.office.net/teams-js/2.0.0/js/MicrosoftTeams.min.js"></script>
<script src="path/to/teams.umd.min.js"></script>

<script>
    // MicrosoftlibTeams is the TeamsLib class
    // Use getInstance() — returns the same instance everywhere
    var lib = MicrosoftlibTeams.getInstance({
        onThemeChange: function (theme) {
            document.body.className = theme;
        },
    });

    lib.init().then(function () {
        console.log("Inside Teams:", lib.isInsideTeams());
        lib.getTheme().then(function (theme) {
            console.log("Theme:", theme);
        });
    });
</script>
```

---

## RequireJS

### Config

The path key **must** be `"microsoftTeams"` — `MicrosoftTeams.min.js` registers itself as a named AMD module with that exact name.

```js
require.config({
    paths: {
        "microsoftTeams":
            "https://res.cdn.office.net/teams-js/2.0.0/js/MicrosoftTeams.min",
        "teams-lib": "path/to/teams.umd.min",
    },
});
```

### Basic Setup

```js
require(["teams-lib"], function (TeamsLib) {
    var lib = TeamsLib.getInstance({
        onThemeChange: function (theme) {
            document.body.className = theme;
        },
    });

    lib.init().then(function () {
        console.log("Inside Teams:", lib.isInsideTeams());
        lib.getTheme().then(function (theme) {
            console.log("Theme:", theme);
        });
    });
});
```

Other modules get the same instance — `init()` is a no-op if already called:

```js
define(["teams-lib"], function (TeamsLib) {
    var lib = TeamsLib.getInstance();
    lib.init().then(function () {
        // already initialized, skips straight through
        lib.getTheme().then(function (theme) {
            console.log("Theme:", theme);
        });
    });
});
```

---

## Full Example

A complete example showing all features.

```html
<!DOCTYPE html>
<html>
    <head>
        <script src="https://res.cdn.office.net/teams-js/2.0.0/js/MicrosoftTeams.min.js"></script>
        <script src="path/to/teams.umd.min.js"></script>
    </head>
    <body>
        <script>
            var lib = MicrosoftlibTeams.getInstance({
                // Called when Teams theme changes
                onThemeChange: function (theme) {
                    // theme = 'light', 'dark', or 'contrast'
                    document.body.className = theme;
                },

                // Enables iframe caching in Teams desktop.
                // Call readyToUnload() when cleanup is done.
                onBeforeUnload: function (readyToUnload) {
                    saveWork();
                    readyToUnload();
                },

                // Called when user returns to cached iframe (pair with onBeforeUnload)
                onResume: function () {
                    refreshData();
                },
            });

            lib.init().then(function () {
                // --- Environment ---
                console.log("Inside Teams:", lib.isInsideTeams());
                lib.getHostName().then(function (host) {
                    console.log("Host:", host);
                });

                // --- Theme ---
                lib.getTheme().then(function (theme) {
                    document.body.className = theme;
                });

                // --- Context ---
                lib.getContext().then(function (ctx) {
                    if (ctx) {
                        console.log("App ID:", ctx.app.appId);
                    }
                });

                // --- State ---
                lib.saveState({ page: "home", scrollY: 0 });
                var state = lib.getState();
                // state = { page: 'home', scrollY: 0 }

                // --- Deeplinks ---

                // Open an app (no specific tab)
                lib.openDeeplink({ appId: "com.example.app" }).then(
                    function (url) {
                        console.log("Opened:", url);
                    },
                );

                // Open an app and pass data
                lib.openDeeplink({
                    appId: "com.example.app",
                    context: { subEntityId: "record-42" },
                }).then(function (url) {
                    console.log("Opened:", url);
                });

                // Open a specific tab
                lib.openDeeplink({
                    appId: "com.example.app",
                    tabId: "dashboard",
                    context: { subEntityId: "item-1" },
                }).then(function (url) {
                    console.log("Opened:", url);
                });

                // Open by URL string
                lib.openDeeplink(
                    "https://teams.microsoft.com/l/entity/com.example.app",
                );

                // --- Share Deeplinks ---

                // Share an app link (native dialog inside Teams, window.open outside)
                lib.shareDeeplink({ appId: "com.example.app" }).then(
                    function (result) {
                        if (result.shared) {
                            console.log("Shared:", result.url);
                        }
                    },
                );

                // Share with a message and context
                lib.shareDeeplink({
                    appId: "com.example.app",
                    tabId: "dashboard",
                    context: { subEntityId: "item-1" },
                    message: "Check this out!",
                }).then(function (result) {
                    console.log("Shared:", result.shared, result.url);
                });
            });
        </script>
    </body>
</html>
```

---

## RequireJS + Marionette Example

```js
require.config({
    paths: {
        "microsoftTeams":
            "https://res.cdn.office.net/teams-js/2.0.0/js/MicrosoftTeams.min",
        "teams-lib": "path/to/teams.umd.min",
    },
});

define(["marionette", "teams-lib"], function (Marionette, TeamsLib) {
    var App = Marionette.Application.extend({
        onBeforeStart: function () {
            var self = this;

            this.teamsLib = TeamsLib.getInstance({
                onThemeChange: function (theme) {
                    self.rootView.applyTheme(theme);
                },
            });
        },

        onStart: function () {
            var self = this;

            this.teamsLib.init().then(function () {
                return self.teamsLib.getTheme();
            }).then(function (theme) {
                self.rootView = new RootLayout({ theme: theme });
                self.getRegion().show(self.rootView);

                Backbone.history.start();
            });
        },
    });

    return new App();
});
```

---

## API Quick Reference

```
MicrosoftlibTeams.getInstance(config)  Singleton — same instance everywhere
new MicrosoftlibTeams(config)          Create a new instance directly

  config.onThemeChange(theme)     'light', 'dark', or 'contrast'
  config.onBeforeUnload(ready)    enables iframe caching, call ready() when done
  config.onResume()               fired on return to cached iframe
  config.onFocusEnter(info)       focus entered tab

lib.init()                        Start SDK, returns Promise (no-op if already called)
lib.isInsideTeams()               true if inside Teams
lib.getContext()                  Promise — fresh Teams context or null
lib.getHostName()                 Promise — 'Teams', host name, or 'Browser'
lib.getTheme()                    Promise — 'light', 'dark', or 'contrast'

lib.openDeeplink(urlOrOptions)    Open deeplink, returns Promise<url>
  options.appId                   Teams app ID
  options.tabId                   tab ID (optional)
  options.context                 data to pass to app (optional)
  options.webUrl                  fallback URL (optional)
  options.label                   display label (optional)

lib.shareDeeplink(options)        Share deeplink, returns Promise<{shared, url}>
  options.appId                   Teams app ID (required)
  options.tabId                   tab ID (optional)
  options.context                 data to pass to app (optional)
  options.message                 share dialog text (optional)
  options.webUrl                  fallback URL (optional)
  options.label                   display label (optional)
  options.preview                 show link preview (optional, Teams only)

lib.saveState(obj)                Save JSON to sessionStorage
lib.getState()                    Load saved state or null
lib.clearState()                  Remove saved state

lib.destroy()                     Clean up listeners
```
