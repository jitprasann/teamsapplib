# @microsoftlib/teams

Simple wrapper for the Microsoft Teams JS SDK (v2).

Works inside Teams and outside Teams. Falls back gracefully when not in Teams.

## Install

```bash
npm install @microsoftlib/teams @microsoft/teams-js@^2.0.0
```

## Quick Start

```js
import { TeamsLib } from '@microsoftlib/teams';

// Use getInstance() to get a singleton — same instance everywhere
var lib = TeamsLib.getInstance({
  onThemeChange: function(theme) { console.log('Theme:', theme); }
});

await lib.init();

lib.isInsideTeams(); // true or false
lib.getTheme();      // 'light', 'dark', 'contrast', or null
```

```js
// Elsewhere in your app — same instance, init() is a no-op
var lib = TeamsLib.getInstance();
await lib.init(); // already initialized, skips
lib.getTheme();
```

## API

### TeamsLib.getInstance(config)

Returns the singleton instance. First call creates it with the provided config; subsequent calls return the same instance (config is ignored after the first call).

```js
var lib = TeamsLib.getInstance({
  onThemeChange: function(theme) {},         // 'light', 'dark', or 'contrast'
  onBeforeUnload: function(readyToUnload) {},// enables iframe caching (Teams only)
  onResume: function() {},                   // fired on return to cached iframe (Teams only)
  onFocusEnter: function(info) {},           // focus entered tab (Teams only)
  state: { persistAcrossSessions: false }    // true = use localStorage
});
```

### new TeamsLib(config)

Creates a new instance directly. Use `getInstance()` when you need a shared singleton across modules.

```js
var lib = new TeamsLib({ onThemeChange: function(theme) {} });
```

### init()

Starts the Teams SDK. Detects environment, loads context, sets theme. If already initialized, returns immediately — safe to call from multiple places.

```js
await lib.init();
```

Returns the instance so you can chain: `var lib = await TeamsLib.getInstance().init();`

### isInsideTeams()

Returns `true` if running inside Teams. Only accurate after `init()`.

```js
if (lib.isInsideTeams()) { /* Teams-specific code */ }
```

### isLikelyInsideTeams()

Quick guess based on iframe/globals. Works before `init()`.

```js
if (lib.isLikelyInsideTeams()) { /* probably Teams */ }
```

### getContext()

Returns the Teams context object, or `null` outside Teams.

```js
var ctx = lib.getContext();
// ctx.app.appId, ctx.user, ctx.channel, etc.
```

### getHostName()

Returns `'Teams'`, a host name from context, or `'Browser'`.

```js
lib.getHostName(); // 'Teams' or 'Browser'
```

### getTheme()

Returns `'light'`, `'dark'`, `'contrast'`, or `null`.

```js
var theme = lib.getTheme();
document.body.className = theme || 'light';
```

The SDK's `"default"` theme is normalized to `"light"`.

### openDeeplink(deeplinkOrOptions)

Opens a Teams deeplink. Detects environment and handles navigation automatically.
Returns the deeplink URL.

- Inside Teams: uses SDK navigation
- Outside Teams: uses `window.open()`

```js
// Open an app (app-level, no tab)
var url = await lib.openDeeplink({ appId: 'com.example.app' });

// Open an app and pass data (no tab needed)
var url = await lib.openDeeplink({
  appId: 'com.example.app',
  context: { subEntityId: 'record-42' }
});

// Open a specific tab
var url = await lib.openDeeplink({
  appId: 'com.example.app',
  tabId: 'dashboard',
  context: { subEntityId: 'item-1' }
});

// Open a URL string directly
var url = await lib.openDeeplink('https://teams.microsoft.com/l/entity/com.example.app');
```

**Options:**

| Name | Type | Description |
|---|---|---|
| `appId` | string | Teams app ID. Auto-detected from context if not provided. |
| `tabId` | string | Tab ID. Skip for app-level links. |
| `context` | object | Data to pass to the app (subEntity payload). |
| `webUrl` | string | Fallback URL for outside Teams. |
| `label` | string | Display label. |

### saveState(obj) / getState() / clearState()

Save and load JSON state. Uses `sessionStorage` by default.

```js
lib.saveState({ page: 'settings', id: 42 });
lib.getState();   // { page: 'settings', id: 42 }
lib.clearState();
lib.getState();   // null
```

Works without `init()`. Use `state: { persistAcrossSessions: true }` in config for `localStorage`.

### destroy()

Removes all listeners. Call when done.

```js
lib.destroy();
```

## Build Formats

| File | Format | How to use |
|---|---|---|
| `dist/teams.esm.js` | ES Module | `import { TeamsLib } from '@microsoftlib/teams'` |
| `dist/teams.cjs.js` | CommonJS | `require('@microsoftlib/teams')` |
| `dist/teams.umd.js` | UMD | `<script>` tag or RequireJS |
| `dist/teams.umd.min.js` | UMD minified | `<script>` tag (production) |

See [README.umd.md](./README.umd.md) for UMD / RequireJS / script tag usage.

## Scripts

```bash
npm run build        # Build all formats
npm test             # Run tests
npm run test:watch   # Watch mode
```

## License

ISC
