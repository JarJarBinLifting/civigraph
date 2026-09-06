import { expect, test } from 'vitest';
import { loadDataset } from './dataset';
import { parseView } from './graph';
import { deleteSavedView, readSavedViews, restoreSavedView, saveView, SAVED_VIEWS_KEY } from './saved-views';
const data = loadDataset();
const date = '2026-09-06T12:00:00.000Z';
function memoryStorage(initial: string | null = null) {
  let raw = initial;
  return { getItem: (key: string) => key === SAVED_VIEWS_KEY ? raw : null, setItem: (_key: string, value: string) => { raw = value; } };
}
test('named views round trip the URL contract and delete only the chosen entry', () => {
  const storage = memoryStorage();
  const view = parseView('?root=Q3052772&compare=Q3579995&comparisonMode=paths&comparisonView=cards&mode=list&categories=&year=2001', data);
  saveView(storage, view, '  Deux parcours  ', 'a', date);
  const views = saveView(storage, parseView('?root=Q662976&time=all', data), 'Assas', 'b', date);
  expect(views.map(item => item.name)).toEqual(['Assas', 'Deux parcours']);
  const stored = readSavedViews(storage);
  expect(stored.problem).toBeNull();
  expect(restoreSavedView(stored.views[1], data)).toEqual({ view, adjusted: false });
  expect(deleteSavedView(storage, 'a').map(item => item.id)).toEqual(['b']);
  expect(readSavedViews(storage).views).toHaveLength(1);
});
test('unavailable, corrupted and future storage never masquerade as a successful save', () => {
  expect(readSavedViews(null).problem).toBe('unavailable');
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  expect(readSavedViews(denied).problem).toBe('unavailable');
  for (const raw of ['{', '{"version":2,"views":[]}', '{"version":1,"views":[{"name":"bad"}]}']) {
    const storage = memoryStorage(raw);
    expect(readSavedViews(storage).problem).toBe('corrupt');
    expect(() => saveView(storage, parseView('', data), 'Nouvelle', 'c', date)).toThrow();
    expect(storage.getItem(SAVED_VIEWS_KEY)).toBe(raw);
  }
  const full = { getItem: () => null, setItem() { throw new Error('quota'); } };
  expect(() => saveView(full, parseView('', data), 'Nouvelle', 'c', date)).toThrow(/stockage/i);
  expect(() => saveView(memoryStorage(), parseView('', data), '   ', 'c', date)).toThrow();
});
test('a removed root blocks restoration while missing secondary entities are explicitly adjusted', () => {
  const storage = memoryStorage();
  const view = parseView('?root=Q3052772&expanded=Q3052772,Q273579&focus=Q273579&selected=Q273579&time=all', data);
  const saved = saveView(storage, view, 'Trajet', 'a', date)[0];
  const without = (id: string) => ({ ...data, entities: data.entities.filter(entity => entity.id !== id), relations: data.relations.filter(relation => relation.source !== id && relation.target !== id) });
  expect(restoreSavedView(saved, without(view.root)).view).toBeNull();
  const restored = restoreSavedView(saved, without('Q273579'));
  expect(restored.adjusted).toBe(true);
  expect(restored.view?.root).toBe(view.root);
  expect(restored.view?.expanded).toEqual([view.root]);
});
