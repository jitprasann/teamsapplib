import { createEnvironmentModule } from '../../src/modules/environment';

describe('environment module', () => {
  let env;

  beforeEach(() => {
    env = createEnvironmentModule();
  });

  test('isInsideTeams() returns false by default', () => {
    expect(env.isInsideTeams()).toBe(false);
  });

  test('setInsideTeams() updates isInsideTeams()', () => {
    env.setInsideTeams(true);
    expect(env.isInsideTeams()).toBe(true);
  });

  test('getContext() returns null by default', () => {
    expect(env.getContext()).toBeNull();
  });

  test('setContext() updates getContext()', () => {
    const ctx = { app: { theme: 'dark' } };
    env.setContext(ctx);
    expect(env.getContext()).toBe(ctx);
  });

  test('getHostName() returns "Browser" when no context', () => {
    expect(env.getHostName()).toBe('Browser');
  });

  test('getHostName() returns host name from context', () => {
    env.setContext({ app: { host: { name: 'Outlook' } } });
    expect(env.getHostName()).toBe('Outlook');
  });

  test('getHostName() returns "Teams" when inside Teams but no host name in context', () => {
    env.setInsideTeams(true);
    env.setContext({ app: {} });
    expect(env.getHostName()).toBe('Teams');
  });

  test('isLikelyInsideTeams() returns false in jsdom (top-level window)', () => {
    // In jsdom, window.self === window.top, so not in iframe
    expect(env.isLikelyInsideTeams()).toBe(false);
  });
});
