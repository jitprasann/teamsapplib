import { createThemeModule } from '../../src/modules/theme';

describe('theme module', () => {
  let callbacks;
  let theme;

  beforeEach(() => {
    callbacks = { onThemeChange: jest.fn() };
    theme = createThemeModule(callbacks);
  });

  test('getCurrent() returns null before init', () => {
    expect(theme.getCurrent()).toBeNull();
  });

  test('init() normalizes "default" to "light"', () => {
    theme.init('default');
    expect(theme.getCurrent()).toBe('light');
  });

  test('init() preserves "dark" as-is', () => {
    theme.init('dark');
    expect(theme.getCurrent()).toBe('dark');
  });

  test('init() preserves "contrast" as-is', () => {
    theme.init('contrast');
    expect(theme.getCurrent()).toBe('contrast');
  });

  test('init() with no argument leaves theme as null', () => {
    theme.init(undefined);
    expect(theme.getCurrent()).toBeNull();
  });

  test('handleChange() updates current theme', () => {
    theme.handleChange('dark');
    expect(theme.getCurrent()).toBe('dark');
  });

  test('handleChange() normalizes "default" to "light"', () => {
    theme.handleChange('default');
    expect(theme.getCurrent()).toBe('light');
  });

  test('handleChange() calls onThemeChange callback', () => {
    theme.handleChange('dark');
    expect(callbacks.onThemeChange).toHaveBeenCalledWith('dark');
  });

  test('handleChange() calls onThemeChange with normalized theme', () => {
    theme.handleChange('default');
    expect(callbacks.onThemeChange).toHaveBeenCalledWith('light');
  });

  test('handleChange() works when no callback provided', () => {
    const noCallbackTheme = createThemeModule({});
    expect(() => noCallbackTheme.handleChange('dark')).not.toThrow();
    expect(noCallbackTheme.getCurrent()).toBe('dark');
  });
});
