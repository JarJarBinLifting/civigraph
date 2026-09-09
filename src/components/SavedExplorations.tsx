'use client';
import { useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import type { GraphData, ViewState } from '@/lib/types';
import { deleteSavedView, readSavedViews, restoreSavedView, saveView } from '@/lib/saved-views';
import { getGraphIndex } from '@/lib/graph-index';

function storage() { try { return window.localStorage; } catch { return null; } }
export function SavedExplorations({ data, view, onRestore }: { data: GraphData; view: ViewState; onRestore: (view: ViewState, adjusted: boolean) => void }) {
  const [result, setResult] = useState(() => readSavedViews(storage()));
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const index = getGraphIndex(data);
  const problem = result.problem === 'corrupt' ? 'Les sauvegardes sont illisibles ou d’une version inconnue. Elles n’ont pas été remplacées.' : result.problem === 'unavailable' ? 'Le stockage local est indisponible. Le partage par URL reste accessible.' : '';
  function save(event: React.FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    try { setResult({ views: saveView(storage(), view, name), problem: null }); setMessage('Exploration enregistrée sur cet appareil.'); setName(''); }
    catch (error) { setError(error instanceof Error ? error.message : 'Enregistrement impossible.'); }
  }
  function remove(id: string) {
    setError(''); setMessage('');
    try { setResult({ views: deleteSavedView(storage(), id), problem: null }); setMessage('Exploration supprimée de cet appareil.'); }
    catch (error) { setError(error instanceof Error ? error.message : 'Suppression impossible.'); }
  }
  return <div className="saved-explorations">
    <p>Donnez un nom à cette vue pour la retrouver avec vos filtres et votre comparaison. Elle sera enregistrée dans ce navigateur, sans compte.</p>
    <form className="save-view-form" onSubmit={save}><label htmlFor="exploration-name">Nom de cette exploration</label><input id="exploration-name" value={name} onChange={event => setName(event.target.value)} maxLength={80} required placeholder="Ex. Parcours à l’ENA" /><button type="submit" className="primary-button" disabled={Boolean(result.problem)}><Bookmark size={15} />Enregistrer cette vue</button></form>
    {(problem || error) && <p className="source-limit" role="alert">{problem || error}</p>}
    <p className="saved-status" role="status">{message}</p>
    <h3>Explorations enregistrées <span>({result.views.length})</span></h3>
    {!result.views.length && !result.problem && <p>Aucune exploration enregistrée.</p>}
    <ul className="saved-view-list">{result.views.map(saved => {
      const restored = restoreSavedView(saved, data);
      const root = restored.view && index.entities.get(restored.view.root);
      const compared = restored.view?.compare && index.entities.get(restored.view.compare);
      return <li key={saved.id}><div><strong>{saved.name}</strong><p>{root?.label}{compared ? ` · ${compared.label}` : ''}</p><small>{new Date(saved.createdAt).toLocaleDateString('fr-FR')}</small>{!restored.view ? <p className="source-limit">La fiche de départ n’est plus disponible.</p> : restored.adjusted ? <p className="source-limit">Certaines fiches ont changé ou disparu. La vue sera rouverte avec les informations encore disponibles.</p> : null}</div><div className="saved-view-actions"><button className="secondary-button" disabled={!restored.view} aria-label={`Restaurer ${saved.name}`} onClick={() => restored.view && onRestore(restored.view, restored.adjusted)}>Restaurer</button><button className="icon-button" aria-label={`Supprimer ${saved.name}`} onClick={() => remove(saved.id)}><Trash2 size={16} /></button></div></li>;
    })}</ul>
    <p className="section-caption">Effacer les données de ce navigateur supprime aussi ces sauvegardes. Le lien de partage permet de conserver une copie ailleurs.</p>
  </div>;
}
