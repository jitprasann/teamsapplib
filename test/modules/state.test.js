import { createStateModule } from '../../src/modules/state';

describe('state module', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  test('save() and get() round-trip through sessionStorage', () => {
    const state = createStateModule();
    const data = { page: 'dashboard', filters: [1, 2, 3] };
    state.save(data);
    expect(state.get()).toEqual(data);
  });

  test('get() returns null when nothing is saved', () => {
    const state = createStateModule();
    expect(state.get()).toBeNull();
  });

  test('clear() removes saved state', () => {
    const state = createStateModule();
    state.save({ a: 1 });
    state.clear();
    expect(state.get()).toBeNull();
  });

  test('persistAcrossSessions uses localStorage', () => {
    const state = createStateModule({ persistAcrossSessions: true });
    state.save({ persistent: true });
    expect(localStorage.getItem('@microsoftlib/teams:appState')).toBeTruthy();
    expect(sessionStorage.getItem('@microsoftlib/teams:appState')).toBeNull();
    expect(state.get()).toEqual({ persistent: true });
  });

  test('default uses sessionStorage, not localStorage', () => {
    const state = createStateModule();
    state.save({ session: true });
    expect(sessionStorage.getItem('@microsoftlib/teams:appState')).toBeTruthy();
    expect(localStorage.getItem('@microsoftlib/teams:appState')).toBeNull();
  });

  test('overwrites previous state', () => {
    const state = createStateModule();
    state.save({ v: 1 });
    state.save({ v: 2 });
    expect(state.get()).toEqual({ v: 2 });
  });
});
