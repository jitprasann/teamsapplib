// Mock for @microsoft/teams-js v2

const mock = {
  app: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getContext: jest.fn().mockResolvedValue({
      app: {
        theme: 'default',
        host: { name: 'Teams' },
        appId: 'test-app-id',
      },
      page: {
        id: 'test-page-id',
      },
    }),
    registerOnThemeChangeHandler: jest.fn(),
    openLink: jest.fn().mockResolvedValue(undefined),
    lifecycle: {
      registerOnResumeHandler: jest.fn(),
    },
  },
  pages: {
    navigateToApp: jest.fn().mockResolvedValue(undefined),
    registerFocusEnterHandler: jest.fn(),
  },
  teamsCore: {
    registerBeforeUnloadHandler: jest.fn(),
  },
};

// Helper to reset all mocks
mock.__resetAllMocks = () => {
  mock.app.initialize.mockClear().mockResolvedValue(undefined);
  mock.app.getContext.mockClear().mockResolvedValue({
    app: {
      theme: 'default',
      host: { name: 'Teams' },
      appId: 'test-app-id',
    },
    page: {
      id: 'test-page-id',
    },
  });
  mock.app.registerOnThemeChangeHandler.mockClear();
  mock.app.openLink.mockClear().mockResolvedValue(undefined);
  mock.app.lifecycle.registerOnResumeHandler.mockClear();
  mock.pages.navigateToApp.mockClear().mockResolvedValue(undefined);
  mock.pages.registerFocusEnterHandler.mockClear();
  mock.teamsCore.registerBeforeUnloadHandler.mockClear();
};

// Helper to simulate init failure (not inside Teams)
mock.__simulateOutsideTeams = () => {
  mock.app.initialize.mockRejectedValue(new Error('SDK init failed'));
};

module.exports = mock;
