import type { GraphData, ViewState } from './types';
import { parseView, serializeView } from './graph';
import { getGraphIndex } from './graph-index';
export const SAVED_VIEWS_KEY = 'civigraph.saved-views.v1';
export type SavedViewStorage = Pick<Storage, 'getItem' | 'setItem'>;
export interface SavedView { id: string; name: string; createdAt: string; query: string }
export interface SavedViewsResult { views: SavedView[]; problem: 'unavailable' | 'corrupt' | null }
function validEntry(value: unknown): value is SavedView {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === 'string' && entry.id.length > 0 && entry.id.length <= 128
    && typeof entry.name === 'string' && entry.name.trim().length > 0 && entry.name.length <= 80
    && typeof entry.createdAt === 'string' && Number.isFinite(Date.parse(entry.createdAt))
    && typeof entry.query === 'string' && entry.query.startsWith('?') && entry.query.length <= 65536;
}
export function readSavedViews(storage: SavedViewStorage | null): SavedViewsResult {
  let raw: string | null;
  try { if (!storage) throw new Error(); raw = storage.getItem(SAVED_VIEWS_KEY); }
  catch { return { views: [], problem: 'unavailable' }; }
  if (raw === null) return { views: [], problem: null };
  try {
    if (raw.length > 4_000_000) throw new Error();
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') throw new Error();
    const record = value as Record<string, unknown>;
    if (record.version !== 1 || !Array.isArray(record.views) || record.views.length > 50 || !record.views.every(validEntry)) throw new Error();
    const views = record.views as SavedView[];
    if (new Set(views.map(view => view.id)).size !== views.length) throw new Error();
    return { views, problem: null };
  } catch { return { views: [], problem: 'corrupt' }; }
}
function currentViews(storage: SavedViewStorage | null) {
  const result = readSavedViews(storage);
  if (result.problem) throw new Error(result.problem === 'corrupt' ? 'Les sauvegardes sont illisibles ou d’une version inconnue. Elles n’ont pas été remplacées.' : 'Le stockage local est indisponible. Vous pouvez partager la vue par URL.');
  return result.views;
}
function writeViews(storage: SavedViewStorage | null, views: SavedView[]) {
  try { if (!storage) throw new Error(); storage.setItem(SAVED_VIEWS_KEY, JSON.stringify({ version: 1, views })); }
  catch { throw new Error('Le stockage local refuse l’écriture. Aucune sauvegarde n’a été confirmée.'); }
  return views;
}
export function saveView(storage: SavedViewStorage | null, view: ViewState, name: string, id = crypto.randomUUID(), createdAt = new Date().toISOString()): SavedView[] {
  const views = currentViews(storage);
  const entry = { id, name: name.trim(), createdAt, query: serializeView(view) };
  if (!validEntry(entry)) throw new Error('Saisissez un nom de 1 à 80 caractères pour une vue valide.');
  if (views.length >= 50) throw new Error('50 explorations sont déjà enregistrées. Supprimez-en une pour en ajouter une autre.');
  if (views.some(view => view.id === id)) throw new Error('Cette sauvegarde existe déjà.');
  return writeViews(storage, [entry, ...views]);
}
export function deleteSavedView(storage: SavedViewStorage | null, id: string): SavedView[] {
  return writeViews(storage, currentViews(storage).filter(view => view.id !== id));
}
export function restoreSavedView(saved: SavedView, data: GraphData): { view: ViewState | null; adjusted: boolean } {
  const root = new URLSearchParams(saved.query).get('root');
  if (!root || !getGraphIndex(data).entities.has(root)) return { view: null, adjusted: true };
  const view = parseView(saved.query, data);
  return { view, adjusted: serializeView(view) !== saved.query };
}
