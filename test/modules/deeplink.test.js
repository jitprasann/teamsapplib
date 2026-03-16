import { createDeeplinkModule } from '../../src/modules/deeplink';

const VALID_APP_ID = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
const CONTEXT_APP_ID = 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6';

describe('deeplink module', () => {
  let envModule;
  let mockSDK;
  let deeplink;

  beforeEach(() => {
    envModule = {
      isInsideTeams: jest.fn().mockReturnValue(false),
      getContext: jest.fn().mockReturnValue({
        app: { appId: CONTEXT_APP_ID },
      }),
    };
    mockSDK = {
      app: {
        openLink: jest.fn().mockResolvedValue(undefined),
      },
      pages: {
        navigateToApp: jest.fn().mockResolvedValue(undefined),
      },
    };
    deeplink = createDeeplinkModule(envModule, mockSDK);
  });

  describe('open()', () => {
    // --- URL building ---

    test('returns app-level URL with only appId', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({ appId: VALID_APP_ID });
      expect(url).toBe(`https://teams.microsoft.com/l/entity/${VALID_APP_ID}`);
      openSpy.mockRestore();
    });

    test('returns tab-level URL with appId and tabId', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({ tabId: 'my-tab', appId: VALID_APP_ID });
      expect(url).toBe(`https://teams.microsoft.com/l/entity/${VALID_APP_ID}/my-tab`);
      openSpy.mockRestore();
    });

    test('returns URL with context (no tabId)', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({
        appId: VALID_APP_ID,
        context: { subEntityId: 'record-42', type: 'order' },
      });
      expect(url).toContain(`https://teams.microsoft.com/l/entity/${VALID_APP_ID}?context=`);
      const contextParam = url.split('context=')[1];
      const decoded = JSON.parse(decodeURIComponent(contextParam));
      expect(decoded).toEqual({ subEntityId: 'record-42', type: 'order' });
      openSpy.mockRestore();
    });

    test('returns URL with tabId and context', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({
        tabId: 'my-tab',
        appId: VALID_APP_ID,
        context: { subEntityId: '123' },
      });
      expect(url).toContain(`/l/entity/${VALID_APP_ID}/my-tab`);
      expect(url).toContain('context=');
      openSpy.mockRestore();
    });

    test('uses appId from context when not provided', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({
        tabId: 'my-tab',
        context: { subEntityId: '456' },
      });
      expect(url).toContain(`/${CONTEXT_APP_ID}/my-tab`);
      openSpy.mockRestore();
    });

    test('throws if no appId available', async () => {
      envModule.getContext.mockReturnValue(null);
      await expect(deeplink.open({ tabId: 'tab' })).rejects.toThrow('appId is required');
    });

    test('throws if appId is not a valid UUID', async () => {
      await expect(deeplink.open({ appId: 'not-a-uuid' })).rejects.toThrow('appId must be a valid UUID');
    });

    test('throws if appId is wrong length', async () => {
      await expect(deeplink.open({ appId: '1234' })).rejects.toThrow('appId must be a valid UUID');
    });

    test('accepts uppercase UUID', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const upper = '1A2B3C4D-5E6F-7A8B-9C0D-1E2F3A4B5C6D';
      const url = await deeplink.open({ appId: upper });
      expect(url).toContain(upper);
      openSpy.mockRestore();
    });

    // --- message option ---

    test('includes message parameter', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({
        appId: VALID_APP_ID,
        message: 'Open order #42',
      });
      expect(url).toContain('message=' + encodeURIComponent('Open order #42'));
      openSpy.mockRestore();
    });

    test('includes message with context', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({
        appId: VALID_APP_ID,
        context: { subEntityId: 'r-42' },
        message: 'View record',
      });
      expect(url).toContain('context=');
      expect(url).toContain('message=' + encodeURIComponent('View record'));
      openSpy.mockRestore();
    });

    test('no message param when not provided', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({ appId: VALID_APP_ID });
      expect(url).not.toContain('message=');
      openSpy.mockRestore();
    });

    // --- other params ---

    test('includes webUrl parameter', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({
        appId: VALID_APP_ID,
        webUrl: 'https://example.com',
      });
      expect(url).toContain('webUrl=' + encodeURIComponent('https://example.com'));
      openSpy.mockRestore();
    });

    test('includes label parameter', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({
        tabId: 'tab',
        appId: VALID_APP_ID,
        label: 'My Tab',
      });
      expect(url).toContain('label=' + encodeURIComponent('My Tab'));
      openSpy.mockRestore();
    });

    test('no query params when no context, message, webUrl, or label', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({ tabId: 'tab', appId: VALID_APP_ID });
      expect(url).toBe(`https://teams.microsoft.com/l/entity/${VALID_APP_ID}/tab`);
      openSpy.mockRestore();
    });

    // --- Navigation: URL string ---

    test('outside Teams with URL string: opens in new window and returns URL', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open('https://teams.microsoft.com/l/entity/app/tab');
      expect(openSpy).toHaveBeenCalledWith(
        'https://teams.microsoft.com/l/entity/app/tab',
        '_blank'
      );
      expect(url).toBe('https://teams.microsoft.com/l/entity/app/tab');
      openSpy.mockRestore();
    });

    test('inside Teams with URL string: uses app.openLink', async () => {
      envModule.isInsideTeams.mockReturnValue(true);
      const url = await deeplink.open('https://teams.microsoft.com/l/entity/app/tab');
      expect(mockSDK.app.openLink).toHaveBeenCalledWith(
        'https://teams.microsoft.com/l/entity/app/tab'
      );
      expect(url).toBe('https://teams.microsoft.com/l/entity/app/tab');
    });

    // --- Navigation: options object ---

    test('inside Teams with options: uses pages.navigateToApp', async () => {
      envModule.isInsideTeams.mockReturnValue(true);
      const url = await deeplink.open({
        tabId: 'my-tab',
        appId: VALID_APP_ID,
        context: { subEntityId: '123' },
      });
      expect(mockSDK.pages.navigateToApp).toHaveBeenCalledWith({
        appId: VALID_APP_ID,
        pageId: 'my-tab',
        subPageId: '{"subEntityId":"123"}',
      });
      expect(url).toContain(`/${VALID_APP_ID}/my-tab`);
    });

    test('inside Teams with options but no tabId: navigateToApp without pageId', async () => {
      envModule.isInsideTeams.mockReturnValue(true);
      const url = await deeplink.open({
        appId: VALID_APP_ID,
        context: { subEntityId: 'record-42' },
      });
      expect(mockSDK.pages.navigateToApp).toHaveBeenCalledWith({
        appId: VALID_APP_ID,
        subPageId: '{"subEntityId":"record-42"}',
      });
      expect(url).toContain(`/${VALID_APP_ID}?context=`);
    });

    test('inside Teams with appId only (no tabId, no context)', async () => {
      envModule.isInsideTeams.mockReturnValue(true);
      const url = await deeplink.open({ appId: VALID_APP_ID });
      expect(mockSDK.pages.navigateToApp).toHaveBeenCalledWith({
        appId: VALID_APP_ID,
      });
      expect(url).toBe(`https://teams.microsoft.com/l/entity/${VALID_APP_ID}`);
    });

    test('outside Teams with options: opens generated deeplink', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({
        tabId: 'tab',
        appId: VALID_APP_ID,
        context: { sub: '1' },
      });
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining(`/l/entity/${VALID_APP_ID}/tab`),
        '_blank'
      );
      openSpy.mockRestore();
    });

    test('outside Teams with appId only: opens app-level URL', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
      const url = await deeplink.open({ appId: VALID_APP_ID });
      expect(openSpy).toHaveBeenCalledWith(
        `https://teams.microsoft.com/l/entity/${VALID_APP_ID}`,
        '_blank'
      );
      expect(url).toBe(`https://teams.microsoft.com/l/entity/${VALID_APP_ID}`);
      openSpy.mockRestore();
    });
  });
});
