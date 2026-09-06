'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, Compass, Copy, GitBranch, GitCompareArrows, GraduationCap, Info, Landmark, Link2, List, Network, RotateCcw, Share2, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, type Category, type Entity, type GraphData, type ViewState } from '@/lib/types';
import { getVisibleGraph, parseView, serializeView } from '@/lib/graph';
import { categoryInfo, initials, periodLabel, shortLabel } from '@/lib/presentation';
import { EntitySearch } from './EntitySearch';
import { GraphCanvas } from './GraphCanvas';
import { DetailPanel } from './DetailPanel';
import { Comparison } from './Comparison';
import { Modal } from './Modal';

export function Explorer({ data, initialView }: { data: GraphData; initialView: ViewState }) {
  const [view, setView] = useState(initialView);
  const [comparisonOpen, setComparisonOpen] = useState(Boolean(initialView.compare));
  const [showFilters, setShowFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const [modal, setModal] = useState<'method' | 'share' | 'corpus' | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [notice, setNotice] = useState('');
  const [corpusQuery, setCorpusQuery] = useState('');
  const { root, expanded, categories, compare } = view;
  const visible = useMemo(() => getVisibleGraph(data, { root, expanded, categories, compare }), [data, root, expanded, categories, compare]);
  const entitiesById = useMemo(() => new Map(data.entities.map(entity => [entity.id, entity])), [data]);
  const rootEntity = entitiesById.get(root)!;
  const selectedEntity = entitiesById.get(view.selected) ?? rootEntity;
  const selectedEdge = data.relations.find(relation => relation.id === view.edge);
  const importedDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(new Date(data.meta.fetchedAt));

  useEffect(() => {
    const restore = () => { const next = parseView(window.location.search, data); setView(next); setComparisonOpen(Boolean(next.compare)); };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [data]);

  const update = useCallback((patch: Partial<ViewState>) => {
    const next = { ...view, ...patch };
    setView(next);
    const search = serializeView(next);
    if (window.location.search !== search) window.history.pushState(null, '', `${window.location.pathname}${search}`);
  }, [view]);

  function startFrom(entity: Entity) {
    update({ root: entity.id, selected: entity.id, expanded: [entity.id], edge: null, compare: null });
    setComparisonOpen(false); setShowDetail(true); setShowFilters(false); setModal(null);
  }
  function select(id: string) { update({ selected: id, edge: null }); setShowDetail(true); }
  function expand(id: string) {
    update({ expanded: [...new Set([...view.expanded, id])], selected: id, edge: null });
    setShowDetail(true);
  }
  function inspectEdge(id: string | null) {
    const relation = data.relations.find(item => item.id === id);
    const selected = relation && view.selected !== relation.source && view.selected !== relation.target ? relation.source : view.selected;
    update({ edge: id, selected });
    setShowDetail(true);
  }
  function toggleCategory(category: Category) {
    update({ categories: categories.includes(category) ? categories.filter(item => item !== category) : CATEGORIES.filter(item => item === category || categories.includes(item)), edge: null });
  }
  function openComparison() {
    if (rootEntity.type !== 'person') {
      const person = data.entities.find(entity => entity.id === 'Q3052772')!;
      update({ root: person.id, selected: person.id, expanded: [person.id], compare: null, edge: null });
    }
    setComparisonOpen(true); setShowFilters(false);
  }
  function openShare() { setShareUrl(`${window.location.origin}${window.location.pathname}${serializeView(view)}`); setCopied(false); setCopyError(false); setModal('share'); }
  async function copyShare() {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  const ownRelations = data.relations.filter(relation => expanded.includes(relation.source) || expanded.includes(relation.target));
  const filteredPeople = data.entities.filter(entity => entity.inCorpus && entity.label.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().includes(corpusQuery.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()));
  const defaultComparisonLeft = rootEntity.type === 'person' ? rootEntity : data.entities.find(entity => entity.id === 'Q3052772')!;

  return <div className="app-shell">
    <a className="skip-link" href="#exploration">Aller à l’exploration</a>
    <header className="app-header">
      <button className="brand" onClick={() => startFrom(data.entities.find(entity => entity.id === 'Q3052772')!)} aria-label="Civigraph, revenir à l’exploration initiale"><span className="brand-symbol"><Network size={22} strokeWidth={1.7} /></span>civigraph<span className="version-tag">V0</span></button>
      <nav className="main-nav" aria-label="Navigation principale"><button className={!comparisonOpen ? 'active' : ''} onClick={() => { setComparisonOpen(false); if (view.compare) update({ compare: null }); }}><Compass size={16} />Explorer</button><button className={comparisonOpen ? 'active' : ''} onClick={openComparison}><GitCompareArrows size={16} />Comparer</button><button onClick={() => setModal('method')}>La méthode<ArrowUpRight size={12} /></button></nav>
      <button className="header-source" onClick={() => setModal('corpus')}><span className="status-dot" />Données ouvertes <ArrowUpRight size={14} /></button>
    </header>
    <section className="intro-bar"><div><p className="eyebrow">Cartographie de la vie publique française</p><h1>Les liens éclairent les parcours<span>.</span></h1><p className="intro-subtitle">Explorez les institutions, les trajectoires et ce qui les relie.</p></div><div className="intro-side"><span className="mini-orbit" aria-hidden="true"><i /><i /><i /></span><p>Chaque lien a une histoire.<br /><strong>Et une source.</strong></p></div></section>
    <div className="workspace-toolbar"><div className="search-area"><EntitySearch data={data} onSelect={startFrom} /></div><div className="toolbar-actions"><button className="secondary-button mobile-filter-toggle" onClick={() => { setShowFilters(!showFilters); setShowDetail(false); }} aria-expanded={showFilters}><SlidersHorizontal size={16} /><span>Filtres</span></button><button className="secondary-button compare-trigger" onClick={openComparison}><GitCompareArrows size={16} /><span>Comparer deux personnes</span></button><button className="primary-button share-trigger" onClick={openShare}><Share2 size={15} /><span>Partager la vue</span></button></div></div>
    <main id="exploration" className={`workspace ${comparisonOpen ? 'is-comparing' : ''} ${!showDetail ? 'detail-closed' : ''}`}>
      <aside className={`sidebar ${showFilters ? 'mobile-open' : ''}`} aria-label="Filtres et parcours">
        <div className="sidebar-heading"><span className="eyebrow">Votre exploration</span><button className="icon-button mobile-only" aria-label="Fermer les filtres" onClick={() => setShowFilters(false)}><X size={17} /></button><Compass size={16} className="desktop-only" /></div>
        <button className="root-receipt" onClick={() => select(root)}><span className="mini-avatar">{initials(rootEntity.label)}</span><span><small>Point de départ</small><strong>{shortLabel(rootEntity)}</strong></span><ChevronRight size={15} /></button>
        <div className="filter-section"><div className="section-heading"><h2>Relations</h2><button onClick={() => update({ categories: categories.length === 5 ? [] : [...CATEGORIES], edge: null })}>{categories.length === 5 ? 'Tout masquer' : 'Tout afficher'}</button></div><p className="section-caption">Choisissez les liens à afficher.</p>
          <div className="category-filters">{CATEGORIES.map(category => <label key={category} style={{ '--category-color': categoryInfo[category].color } as React.CSSProperties}><input type="checkbox" checked={categories.includes(category)} onChange={() => toggleCategory(category)} /><span className="custom-checkbox"><Check size={11} /></span><span>{categoryInfo[category].label}</span><small>{ownRelations.filter(relation => relation.category === category).length}</small></label>)}</div>
        </div>
        <div className="scope-section"><div className="section-heading"><h2>Périmètre</h2><Info size={13} /></div><p><CalendarIcon />Toutes les périodes documentées</p><span>Les dates sont précisées dans les fiches.</span></div>
        {expanded.length > 1 && <div className="expanded-section"><span className="eyebrow">Réseaux développés</span>{expanded.filter(id => id !== root).map(id => <div key={id}><button onClick={() => select(id)}>{shortLabel(entitiesById.get(id)!)}</button><button className="icon-button" aria-label={`Replier ${shortLabel(entitiesById.get(id)!)}`} onClick={() => update({ expanded: expanded.filter(item => item !== id), selected: root, edge: null })}><X size={12} /></button></div>)}</div>}
        <button className="reset-button" onClick={() => { update({ expanded: [root], categories: [...CATEGORIES], selected: root, compare: null, edge: null }); setComparisonOpen(false); }}><RotateCcw size={13} />Réinitialiser cette vue</button>
        <div className="suggested-paths"><span className="eyebrow">Une piste à explorer</span><button onClick={() => startFrom(entitiesById.get('Q273579')!)}><span className="path-icon"><GraduationCap size={18} /></span><span><strong>Les parcours de l’ENA</strong><small>Une école, plusieurs trajectoires</small></span><ArrowUpRight size={15} /></button><button onClick={() => startFrom(entitiesById.get('Q1587677')!)}><span className="path-icon blue"><Landmark size={17} /></span><span><strong>Passages à Matignon</strong><small>Explorer une fonction publique</small></span><ArrowUpRight size={15} /></button></div>
        <div className="sidebar-bottom"><div className="prototype-tag"><span className="status-dot" />Prototype exploratoire</div><p>{data.meta.peopleCount} personnalités · corpus limité</p><button onClick={() => setModal('corpus')}>Découvrir le corpus<ArrowUpRight size={12} /></button></div>
      </aside>

      <section className="exploration-center" aria-label="Vue d’exploration">
        {comparisonOpen ? <Comparison data={data} left={defaultComparisonLeft} right={compare ? entitiesById.get(compare) : undefined} categories={categories}
          onLeft={entity => update({ root: entity.id, selected: entity.id, expanded: [entity.id], edge: null })}
          onRight={entity => update({ compare: entity.id, edge: null })}
          onExplore={id => { update({ selected: id, expanded: [...new Set([...expanded, id])], edge: null, compare: null }); setComparisonOpen(false); setShowDetail(true); }}
          onClose={() => { setComparisonOpen(false); update({ compare: null }); }} /> : <>
          <div className="graph-topbar"><div className="breadcrumb"><span>Explorer</span><ChevronRight size={12} /><strong>{shortLabel(rootEntity)}</strong></div><div className="view-toggle" role="group" aria-label="Mode d’affichage"><button aria-pressed={view.mode === 'graph'} onClick={() => update({ mode: 'graph' })}><Network size={14} /><span>Graphe</span></button><button aria-pressed={view.mode === 'list'} onClick={() => update({ mode: 'list' })}><List size={15} /><span>Liste</span></button></div></div>
          <div className="graph-meta"><span><i className="status-dot" />{visible.entities.length} entités</span><span>{visible.relations.length} liens</span><span className="graph-scope">dans cette vue</span>{!showDetail && <button className="subtle-link" onClick={() => setShowDetail(true)}>Ouvrir la fiche<ArrowUpRight size={12} /></button>}</div>
          {notice && <p className="inline-notice" role="status">{notice}</p>}
          {view.mode === 'graph' ? <GraphCanvas entities={visible.entities} relations={visible.relations} root={root} selected={view.selected} selectedEdge={view.edge} compare={view.compare} onSelect={select} onEdge={inspectEdge} onExpand={expand} onFallback={() => { update({ mode: 'list' }); setNotice('Le graphe ne peut pas être affiché dans ce navigateur. Tous les liens restent accessibles dans la liste.'); }} /> : <div className="graph-list" aria-label="Liste des relations visibles">
            {visible.relations.map(relation => <article className="graph-list-row" key={relation.id}>
              <span className="connection-dot" style={{ background: categoryInfo[relation.category].color }} />
              <div><span className="eyebrow">{categoryInfo[relation.category].singular}</span><p><button onClick={() => select(relation.source)}>{shortLabel(entitiesById.get(relation.source)!)}</button><ArrowRight size={13} /><button onClick={() => select(relation.target)}>{shortLabel(entitiesById.get(relation.target)!)}</button></p><small>{periodLabel(relation)}</small></div>
              <button className="icon-button" aria-label={`Source : ${shortLabel(entitiesById.get(relation.source)!)} et ${shortLabel(entitiesById.get(relation.target)!)}`} onClick={() => inspectEdge(relation.id)}><Link2 size={16} /></button>
              <button className="icon-button" aria-label={`Développer ${shortLabel(entitiesById.get(relation.target)!)}`} onClick={() => expand(relation.target)}><GitBranch size={16} /></button>
            </article>)}
            {!visible.relations.length && <div className="empty-state"><SlidersHorizontal size={28} /><strong>Aucune relation affichée</strong><p>Activez une catégorie dans les filtres pour explorer les liens.</p><button className="secondary-button" onClick={() => update({ categories: [...CATEGORIES] })}>Afficher toutes les catégories</button></div>}
          </div>}
          <div className="graph-bottom"><span><Info size={13} />Un lien documenté n’implique pas une proximité personnelle.</span><button onClick={() => setModal('method')}>Lire la méthode<ArrowUpRight size={12} /></button></div>
        </>}
      </section>
      {!comparisonOpen && showDetail && <DetailPanel key={selectedEntity.id} data={data} entity={selectedEntity} categories={categories} selectedEdge={selectedEdge} expanded={expanded.includes(selectedEntity.id)} onSelect={select} onEdge={inspectEdge} onExpand={expand} onClose={() => setShowDetail(false)} />}
    </main>
    <footer className="app-footer"><span><BookOpen size={12} />Source : Wikidata · instantané du {importedDate}</span><span>Données CC0 <span className="footer-divider">/</span> Un outil pour comprendre, librement.</span><button onClick={() => setModal('method')}>À propos de Civigraph<ArrowUpRight size={12} /></button></footer>

    {modal === 'share' && <Modal title="Partager cette exploration" onClose={() => setModal(null)}><div className="modal-emblem"><Share2 size={25} /></div><p>Retrouvez le point de départ, les réseaux développés, la sélection, les filtres et la comparaison dans une même URL.</p><label className="share-label" htmlFor="share-url">Lien vers cette vue</label><div className="share-input"><input id="share-url" readOnly value={shareUrl} onFocus={event => event.target.select()} /><button className="primary-button" onClick={copyShare}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copié' : 'Copier'}</button></div>{copyError && <p className="source-limit" role="status">La copie automatique est indisponible. Sélectionnez le lien puis utilisez Ctrl+C ou Cmd+C.</p>}<p className="local-share-note">Cette instance fonctionne en local. Le lien s’ouvre sur cet ordinateur ; il deviendra accessible à d’autres personnes lorsque l’application sera hébergée.</p></Modal>}
    {modal === 'method' && <Modal title="Comprendre les liens" onClose={() => setModal(null)}><p className="modal-lede">La transparence fait partie du graphe.</p><p>Civigraph représente des relations publiques consignées dans Wikidata : formations, fonctions, affiliations politiques, employeurs et organisations. Chaque trait permet de remonter à une déclaration.</p><div className="method-grid"><article><span>01</span><h3>Une relation, une provenance</h3><p>Les déclarations originales, leur version à l’import et les références disponibles sont consultables dans les fiches.</p></article><article><span>02</span><h3>Des périodes explicites</h3><p>Les dates conservent leur précision d’origine. Une fin non renseignée ne signifie pas que la fonction est toujours exercée.</p></article><article><span>03</span><h3>Des parcours, sans présomption</h3><p>Une école commune ne démontre pas une rencontre. Les intitulés de fonctions sont distingués de leur périmètre lorsque Wikidata le précise.</p></article><article><span>04</span><h3>Un corpus à ses débuts</h3><p>Cette V0 couvre {data.meta.peopleCount} personnes. Elle est non exhaustive, non représentative et ne se met pas à jour en continu.</p></article></div><div className="method-note"><Info size={19} /><p>Les déclarations Wikidata ne sont pas vérifiées indépendamment ici. {data.relations.filter(relation => relation.references.some(reference => reference.urls.length)).length} sur {data.meta.relationCount} comportent une URL de référence externe. Les autres restent signalées comme déclarations à recouper.</p></div><a className="subtle-link" href="https://www.wikidata.org/wiki/Wikidata:Data_access/fr" target="_blank" rel="noopener noreferrer">Accès aux données et licence Wikidata<ArrowUpRight size={14} /></a></Modal>}
    {modal === 'corpus' && <Modal title="Le corpus de la V0" onClose={() => setModal(null)}><p>Un premier terrain d’exploration de la vie politique française, des présidences aux parcours parlementaires. La sélection est éditoriale et ne constitue pas un échantillon représentatif.</p><div className="corpus-stats"><div><strong>{data.meta.peopleCount}</strong><span>personnalités</span></div><div><strong>{data.meta.entityCount}</strong><span>entités</span></div><div><strong>{data.meta.relationCount}</strong><span>déclarations</span></div></div><p className="section-caption">Import Wikidata du {importedDate} · données structurées sous CC0</p><input className="corpus-search" aria-label="Filtrer les personnes du corpus" value={corpusQuery} onChange={event => setCorpusQuery(event.target.value)} placeholder="Retrouver un nom dans le corpus…" /><div className="corpus-list">{filteredPeople.map(entity => <button key={entity.id} onClick={() => startFrom(entity)}><span className="mini-avatar">{initials(entity.label)}</span><span>{entity.label}</span><ArrowUpRight size={15} /></button>)}</div>{!filteredPeople.length && <p className="empty-search">Aucune personne trouvée dans ce corpus.</p>}</Modal>}
    <span className="sr-only" aria-live="polite">{visible.entities.length} entités et {visible.relations.length} relations affichées.</span>
  </div>;
}

function CalendarIcon() { return <span className="period-icon" aria-hidden="true">↔</span>; }
