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
    var lib = new MicrosoftlibTeams({
        onThemeChange: function (theme) {
            document.body.className = theme;
        },
    });

    lib.init().then(function () {
        console.log("Inside Teams:", lib.isInsideTeams());
        console.log("Theme:", lib.getTheme());
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
    var lib = new TeamsLib({
        onThemeChange: function (theme) {
            document.body.className = theme;
        },
    });

    lib.init().then(function () {
        console.log("Inside Teams:", lib.isInsideTeams());
        console.log("Theme:", lib.getTheme());
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
            var lib = new MicrosoftlibTeams({
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
                console.log("Host:", lib.getHostName());

                // --- Theme ---
                var theme = lib.getTheme() || "light";
                document.body.className = theme;

                // --- Context ---
                var ctx = lib.getContext();
                if (ctx) {
                    console.log("App ID:", ctx.app.appId);
                }

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

            this.teamsLib = new TeamsLib({
                onThemeChange: function (theme) {
                    self.rootView.applyTheme(theme);
                },
            });
        },

        onStart: function () {
            var self = this;

            this.teamsLib.init().then(function () {
                var theme = self.teamsLib.getTheme() || "light";

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
new MicrosoftlibTeams(config)     Create instance with callbacks
  config.onThemeChange(theme)     'light', 'dark', or 'contrast'
  config.onBeforeUnload(ready)    enables iframe caching, call ready() when done
  config.onResume()               fired on return to cached iframe
  config.onFocusEnter(info)       focus entered tab

lib.init()                        Start SDK, returns Promise
lib.isInsideTeams()               true if inside Teams
lib.getContext()                  Teams context object or null
lib.getHostName()                 'Teams', host name, or 'Browser'
lib.getTheme()                    'light', 'dark', 'contrast', or null

lib.openDeeplink(urlOrOptions)    Open deeplink, returns Promise<url>
  options.appId                   Teams app ID
  options.tabId                   tab ID (optional)
  options.context                 data to pass to app (optional)
  options.webUrl                  fallback URL (optional)
  options.label                   display label (optional)

lib.saveState(obj)                Save JSON to sessionStorage
lib.getState()                    Load saved state or null
lib.clearState()                  Remove saved state

lib.destroy()                     Clean up listeners
```
