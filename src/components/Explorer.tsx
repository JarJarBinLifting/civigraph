'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Bookmark, Check, ChevronRight, Compass, Copy, GitBranch, GitCompareArrows, GraduationCap, Info, Landmark, Link2, List, Network, RotateCcw, Share2, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, type Category, type Entity, type GraphData, type ViewState } from '@/lib/types';
import { careerView, focusView, getPeriodContext, getVisibleGraph, parseView, serializeView } from '@/lib/graph';
import { categoryInfo, periodLabel, shortLabel } from '@/lib/presentation';
import { EntitySearch } from './EntitySearch';
import { GraphCanvas } from './GraphCanvas';
import { ChronologyControls } from './ChronologyControls';
import { getChronology, getTimeReference } from '@/lib/graph-layout';
import { DetailPanel } from './DetailPanel';
import { Comparison } from './Comparison';
import { Modal } from './Modal';
import { PeriodControls } from './PeriodControls';
import { getGraphIndex } from '@/lib/graph-index';
import { containFocus } from '@/lib/focus';
import { SavedExplorations } from './SavedExplorations';
import { EntityAvatar } from './EntityAvatar';
import { graphExportInfo } from '@/lib/graph-export';

export function Explorer({ data, initialView }: { data: GraphData; initialView: ViewState }) {
  const [view, setView] = useState(initialView);
  const [comparisonOpen, setComparisonOpen] = useState(Boolean(initialView.compare));
  const [showFilters, setShowFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const [enlarged, setEnlarged] = useState(false);
  const workspace = useRef<HTMLElement>(null);
  const [modal, setModal] = useState<'method' | 'share' | 'corpus' | 'saved' | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [notice, setNotice] = useState('');
  const [corpusQuery, setCorpusQuery] = useState('');
  const { root, focus, expanded, categories, compare, temporal, period } = view;
  const visible = useMemo(() => getVisibleGraph(data, { root, focus, expanded, categories, compare, temporal, period }), [data, root, focus, expanded, categories, compare, temporal, period]);
  const chronology = useMemo(() => getChronology(visible, focus, getTimeReference(data, { year: view.year, period })), [visible, focus, data, view.year, period]);
  const periodContext = useMemo(() => getPeriodContext(data, { root, focus, expanded, period, categories }), [data, root, focus, expanded, period, categories]);
  const exportInfo = useMemo(() => graphExportInfo(data, view, visible, chronology), [data, view, visible, chronology]);
  const index = useMemo(() => getGraphIndex(data), [data]);
  const entitiesById = index.entities;
  const rootEntity = entitiesById.get(root)!;
  const focusEntity = entitiesById.get(focus)!;
  const selectedEntity = entitiesById.get(view.selected) ?? rootEntity;
  const selectedEdge = index.relations.get(view.edge ?? '');
  const importedDate = useMemo(() => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(new Date(data.meta.fetchedAt)), [data.meta.fetchedAt]);
  const wikidataRelations = useMemo(() => data.relations.filter(relation => !relation.evidence), [data]);
  const officialCount = data.relations.length - wikidataRelations.length;

  useEffect(() => {
    const restore = () => { const next = parseView(window.location.search, data); setView(next); setComparisonOpen(Boolean(next.compare)); };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [data]);

  useEffect(() => {
    if (!enlarged || !workspace.current) return;
    const element = workspace.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const siblings = [...element.parentElement!.children].filter(item => item !== element) as HTMLElement[];
    const wasInert = siblings.map(item => item.inert);
    siblings.forEach(item => { item.inert = true; });
    document.body.style.overflow = 'hidden';
    element.querySelector<HTMLButtonElement>('.enlarged-close')?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setEnlarged(false); }
      else containFocus(event, element);
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('keydown', keyboard);
      siblings.forEach((item, i) => { item.inert = wasInert[i]; });
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [enlarged]);

  const update = useCallback((patch: Partial<ViewState>) => {
    const next = { ...view, ...patch };
    setView(next);
    const search = serializeView(next);
    if (window.location.search !== search) window.history.pushState(null, '', `${window.location.pathname}${search}`);
  }, [view]);

  function startFrom(entity: Entity) {
    update({ root: entity.id, focus: entity.id, selected: entity.id, expanded: [entity.id], edge: null, compare: null, period: null, temporal: 'all', year: null });
    setComparisonOpen(false); setShowDetail(true); setShowFilters(false); setModal(null);
  }

  function select(id: string) { update({ selected: id, edge: null }); setShowDetail(true); }
  function expand(id: string) {
    update(focusView(view, id, data));
    setShowDetail(true);
  }
  function exploreCareer(id: string) {
    update(careerView(view, id, data));
    setShowDetail(true);
  }
  function inspectEdge(id: string | null) {
    const relation = index.relations.get(id ?? '');
    const selected = relation && view.selected !== relation.source && view.selected !== relation.target ? relation.source : view.selected;
    update({ edge: id, selected });
    setShowDetail(true);
  }
  function toggleCategory(category: Category) {
    update({ categories: categories.includes(category) ? categories.filter(item => item !== category) : CATEGORIES.filter(item => item === category || categories.includes(item)), edge: null });
  }
  function openComparison() {
    const person = focusEntity.type === 'person' ? focusEntity : rootEntity.type === 'person' ? rootEntity : entitiesById.get('Q3052772')!;
    if (root !== person.id || focus !== person.id || temporal !== 'all' || period) {
      update({ root: person.id, focus: person.id, selected: person.id, expanded: [person.id], compare: null, edge: null, temporal: 'all', period: null });
    }
    setComparisonOpen(true); setShowFilters(false);
  }
  function openShare() { setShareUrl(`${window.location.origin}${window.location.pathname}${serializeView(view)}`); setCopied(false); setCopyError(false); setModal('share'); }
  function restoreExploration(next: ViewState, adjusted: boolean) {
    setView(next);
    window.history.pushState(null, '', `${window.location.pathname}${serializeView(next)}`);
    setComparisonOpen(Boolean(next.compare)); setShowDetail(true); setShowFilters(false); setModal(null);
    setNotice(adjusted ? 'Exploration restaurée avec les éléments encore disponibles dans le corpus.' : 'Exploration restaurée.');
  }
  async function copyShare() {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  }
  const ownRelations = useMemo(() => getVisibleGraph(data, { root, focus, expanded, categories: [...CATEGORIES], compare, temporal, period }).relations, [data, root, focus, expanded, compare, temporal, period]);
  const filteredPeople = data.entities.filter(entity => entity.inCorpus && entity.label.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().includes(corpusQuery.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()));
  const defaultComparisonLeft = rootEntity.type === 'person' ? rootEntity : data.entities.find(entity => entity.id === 'Q3052772')!;

  return <div className="app-shell">
    <a className="skip-link" href="#exploration">Aller à l’exploration</a>
    <header className="app-header">
      <button className="brand" onClick={() => startFrom(data.entities.find(entity => entity.id === 'Q3052772')!)} aria-label="Civigraph, revenir à l’exploration initiale"><span className="brand-symbol"><Network size={22} strokeWidth={1.7} /></span>civigraph<span className="version-tag">V0</span></button>
      <nav className="main-nav" aria-label="Navigation principale"><button className={!comparisonOpen ? 'active' : ''} onClick={() => { setComparisonOpen(false); if (view.compare) update({ compare: null }); }}><Compass size={16} />Explorer</button><button className={comparisonOpen ? 'active' : ''} onClick={openComparison}><GitCompareArrows size={16} />Comparer</button><button onClick={() => setModal('method')}>La méthode<ArrowUpRight size={12} /></button></nav>
      <button className="header-source" onClick={() => setModal('corpus')}><span className="status-dot" />Données ouvertes <ArrowUpRight size={14} /></button>
    </header>
    <section className="intro-bar"><div><p className="eyebrow">Atlas de la vie publique française</p><h1>Les liens éclairent les parcours<span>.</span></h1></div></section>
    <div className="workspace-toolbar"><div className="search-area"><EntitySearch data={data} onSelect={startFrom} /></div><div className="toolbar-actions"><button className="secondary-button mobile-filter-toggle" onClick={() => { setShowFilters(!showFilters); setShowDetail(false); }} aria-expanded={showFilters}><SlidersHorizontal size={16} /><span>Filtres</span></button><button className="secondary-button compare-trigger" onClick={openComparison}><GitCompareArrows size={16} /><span>Comparer deux personnes</span></button><button className="secondary-button saved-trigger" onClick={() => setModal('saved')} aria-label="Mes explorations" title="Mes explorations"><Bookmark size={16} /><span>Mes explorations</span></button><button className="primary-button share-trigger" onClick={openShare}><Share2 size={15} /><span>Partager la vue</span></button></div></div>
    <main id="exploration" ref={workspace} role={enlarged ? 'dialog' : undefined} aria-modal={enlarged || undefined} aria-label={enlarged ? 'Carte agrandie' : undefined} className={`workspace ${comparisonOpen ? 'is-comparing' : ''} ${!showDetail ? 'detail-closed' : ''} ${enlarged ? 'map-expanded' : ''}`}>
      {enlarged && <div className="enlarged-bar"><button className="secondary-button enlarged-close" onClick={() => setEnlarged(false)}><X size={16} />Réduire la carte</button><span>Explorer, filtrer, consulter les sources</span><button className="secondary-button mobile-only" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>Filtres</button></div>}
      <aside className={`sidebar ${showFilters ? 'mobile-open' : ''}`} aria-label="Filtres et parcours">
        <div className="sidebar-heading"><span className="eyebrow">Votre exploration</span><button className="icon-button mobile-only" aria-label="Fermer les filtres" onClick={() => setShowFilters(false)}><X size={17} /></button><Compass size={16} className="desktop-only" /></div>
        <button className="root-receipt" onClick={() => expand(root)}><EntityAvatar entity={rootEntity} /><span><small>Point de départ</small><strong>{shortLabel(rootEntity)}</strong></span><ChevronRight size={15} /></button>
        <div className="filter-section"><div className="section-heading"><h2>Relations</h2><button onClick={() => update({ categories: categories.length === 5 ? [] : [...CATEGORIES], edge: null })}>{categories.length === 5 ? 'Tout masquer' : 'Tout afficher'}</button></div><p className="section-caption">Choisissez les liens à afficher.</p>
          <div className="category-filters">{CATEGORIES.map(category => <label key={category} style={{ '--category-color': categoryInfo[category].color } as React.CSSProperties}><input type="checkbox" checked={categories.includes(category)} onChange={() => toggleCategory(category)} /><span className="custom-checkbox"><Check size={11} /></span><span>{categoryInfo[category].label}</span><small>{ownRelations.filter(relation => relation.category === category).length}</small></label>)}</div>
        </div>
        <div className="scope-section"><div className="section-heading"><h2>Périmètre</h2><Info size={13} /></div><p><CalendarIcon />{temporal === 'same' && periodContext.anchor ? periodContext.anchor.cohort?.label ?? periodLabel(periodContext.anchor) : 'Toutes les périodes documentées'}</p><span>{temporal === 'same' ? 'Les dates insuffisantes se consultent séparément ; chaque personne permet de repartir vers sa carrière complète.' : 'Les dates sont précisées dans les fiches.'}</span></div>
        {expanded.length > 1 && <div className="expanded-section"><span className="eyebrow">Parcours d’exploration</span>{expanded.filter(id => id !== root).map(id => <div key={id}><button aria-current={id === focus ? 'step' : undefined} onClick={() => expand(id)}>{shortLabel(entitiesById.get(id)!)}</button><button className="icon-button" aria-label={`Revenir avant ${shortLabel(entitiesById.get(id)!)}`} onClick={() => expand(expanded[expanded.indexOf(id) - 1] ?? root)}><X size={12} /></button></div>)}</div>}
        <button className="reset-button" onClick={() => { update({ focus: root, expanded: [root], categories: [...CATEGORIES], selected: root, compare: null, edge: null, period: null, temporal: 'all', year: null }); setComparisonOpen(false); }}><RotateCcw size={13} />Réinitialiser cette vue</button>
        <div className="suggested-paths"><span className="eyebrow">Une piste à explorer</span><button onClick={() => startFrom(entitiesById.get('Q273579')!)}><span className="path-icon"><GraduationCap size={18} /></span><span><strong>Les parcours de l’ENA</strong><small>Une école, plusieurs trajectoires</small></span><ArrowUpRight size={15} /></button><button onClick={() => startFrom(entitiesById.get('Q1587677')!)}><span className="path-icon blue"><Landmark size={17} /></span><span><strong>Passages à Matignon</strong><small>Explorer une fonction publique</small></span><ArrowUpRight size={15} /></button></div>
        <div className="sidebar-bottom"><div className="prototype-tag"><span className="status-dot" />Prototype exploratoire</div><p>{data.meta.peopleCount} personnalités · corpus limité</p><button onClick={() => setModal('corpus')}>Découvrir le corpus<ArrowUpRight size={12} /></button></div>
      </aside>

      <section className={`exploration-center${periodContext.institution && !comparisonOpen ? ' has-period-controls' : ''}`} aria-label="Vue d’exploration">
        {comparisonOpen ? <Comparison data={data} left={defaultComparisonLeft} right={compare ? entitiesById.get(compare) : undefined} categories={categories}
          selected={view.selected} presentation={view.comparisonView} onSelect={id => update({ selected: id })} onPresentation={comparisonView => update({ comparisonView })}
          mode={view.comparisonMode} onMode={comparisonMode => update({ comparisonMode })}
          onLeft={entity => update({ root: entity.id, focus: entity.id, selected: entity.id, expanded: [entity.id], edge: null, period: null, temporal: 'all' })}
          onRight={entity => update({ compare: entity.id, edge: null })}
          onExplore={id => { expand(id); setComparisonOpen(false); }}
          onClose={() => { setComparisonOpen(false); update({ compare: null }); }} /> : <>
          <div className="graph-topbar"><div className="breadcrumb"><span>Au centre</span><strong>{shortLabel(focusEntity)}</strong></div><div className="map-display-controls"><button className="enlarge-trigger" onClick={() => setEnlarged(true)} aria-hidden={enlarged || undefined} tabIndex={enlarged ? -1 : undefined} style={enlarged ? { visibility: 'hidden' } : undefined}>Agrandir la carte</button><div className="view-toggle" role="group" aria-label="Mode d’affichage"><button aria-pressed={view.mode === 'graph'} onClick={() => update({ mode: 'graph' })}><Network size={14} /><span>Graphe</span></button><button aria-pressed={view.mode === 'list'} onClick={() => update({ mode: 'list' })}><List size={15} /><span>Liste</span></button></div></div></div>
          <div className="graph-meta"><span><i className="status-dot" />{visible.entities.length} entités</span><span>{visible.relations.length} liens</span><span className="graph-scope">dans ce réseau</span>{!showDetail && <button className="subtle-link" onClick={() => setShowDetail(true)}>Ouvrir la fiche<ArrowUpRight size={12} /></button>}</div>
          <PeriodControls data={data} view={view} onChange={update} onEvidence={inspectEdge} onSelect={select} onCareer={exploreCareer} />
          {notice && <p className="inline-notice" role="status">{notice}</p>}
          {view.mode === 'graph' && <ChronologyControls key={`${focus}:${chronology.reference.label}`} chronology={chronology} customYear={view.year} onYear={year => update({ year })} />}
          {view.mode === 'graph' ? <GraphCanvas entities={visible.entities} relations={visible.relations} chronology={chronology} trail={expanded} focus={focus} anchor={expanded[expanded.indexOf(focus) - 1]} selected={view.selected} selectedEdge={view.edge} compare={view.compare} exportInfo={exportInfo} onSelect={select} onEdge={inspectEdge} onExpand={expand} onFallback={() => { update({ mode: 'list' }); setNotice('Le graphe ne peut pas être affiché dans ce navigateur. Tous les liens restent accessibles dans la liste.'); }} /> : <div className="graph-list" aria-label="Liste des relations visibles">
            {visible.relations.map(relation => <article className="graph-list-row" key={relation.id}>
              <span className="connection-dot" style={{ background: categoryInfo[relation.category].color }} />
              <div><span className="eyebrow">{categoryInfo[relation.category].singular}</span><p><button onClick={() => select(relation.source)}>{shortLabel(entitiesById.get(relation.source)!)}</button><ArrowRight size={13} /><button onClick={() => select(relation.target)}>{shortLabel(entitiesById.get(relation.target)!)}</button></p>{relation.role && <small className="connection-role">{relation.role}</small>}<small>{relation.cohort?.label ?? periodLabel(relation)}</small></div>
              <button className="icon-button" aria-label={`Source : ${shortLabel(entitiesById.get(relation.source)!)} et ${shortLabel(entitiesById.get(relation.target)!)}`} onClick={() => inspectEdge(relation.id)}><Link2 size={16} /></button>
              <button className="icon-button" aria-label={`Développer ${shortLabel(entitiesById.get(relation.target)!)}`} onClick={() => expand(relation.target)}><GitBranch size={16} /></button>
            </article>)}
            {!visible.relations.length && <div className="empty-state"><SlidersHorizontal size={28} /><strong>Aucune relation affichée</strong><p>{temporal === 'same' ? 'Aucun lien ne satisfait à la fois cette période et les catégories actives.' : 'Activez une catégorie dans les filtres pour explorer les liens.'}</p>{temporal === 'same' && <button className="secondary-button" onClick={() => update({ temporal: 'all', edge: null })}>Voir toutes les périodes</button>}<button className="secondary-button" onClick={() => update({ categories: [...CATEGORIES] })}>Afficher toutes les catégories</button></div>}
          </div>}
          <div className="graph-bottom"><span><Info size={13} />Un lien documenté n’implique pas une proximité personnelle.</span><button onClick={() => setModal('method')}>Lire la méthode<ArrowUpRight size={12} /></button></div>
        </>}
      </section>
      {!comparisonOpen && showDetail && <DetailPanel key={selectedEntity.id} data={data} entity={selectedEntity} categories={categories} temporal={temporal} periodAnchor={periodContext.anchor} selectedEdge={selectedEdge} focused={focus === selectedEntity.id} onSelect={select} onEdge={inspectEdge} onExpand={expand} onCareer={exploreCareer} onAllPeriods={() => update({ temporal: 'all', edge: null })} onClose={() => setShowDetail(false)} />}
    </main>
    <footer className="app-footer"><span><BookOpen size={12} />Wikidata et sources officielles · {importedDate}</span><a href="/methode">Méthode et couverture</a><button onClick={() => setModal('method')}>À propos de Civigraph<ArrowUpRight size={12} /></button></footer>

    {modal === 'saved' && <Modal title="Mes explorations" onClose={() => setModal(null)}><SavedExplorations data={data} view={view} onRestore={restoreExploration} /></Modal>}

    {modal === 'share' && <Modal title="Partager cette exploration" onClose={() => setModal(null)}><div className="modal-emblem"><Share2 size={25} /></div><p>Retrouvez le point de départ, les réseaux développés, la sélection, les filtres, la période et la comparaison dans une même URL.</p><label className="share-label" htmlFor="share-url">Lien vers cette vue</label><div className="share-input"><input id="share-url" readOnly value={shareUrl} onFocus={event => event.target.select()} /><button className="primary-button" onClick={copyShare}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copié' : 'Copier'}</button></div>{copyError && <p className="source-limit" role="status">La copie automatique est indisponible. Sélectionnez le lien puis utilisez Ctrl+C ou Cmd+C.</p>}<p className="local-share-note">Cette instance fonctionne en local. Le lien s’ouvre sur cet ordinateur ; il deviendra accessible à d’autres personnes lorsque l’application sera hébergée.</p></Modal>}
    {modal === 'method' && <Modal title="Comprendre les liens" onClose={() => setModal(null)}><p className="modal-lede">La transparence fait partie du graphe.</p><p>Civigraph représente des relations publiques : formations, fonctions, affiliations politiques, employeurs et organisations. Les déclarations Wikidata sont complétées par les mandats de l’Assemblée nationale, des déclarations HATVP distribuées par Integrity Watch France et des compositions officielles d’institutions. Chaque trait donne accès à sa provenance.</p><div className="method-grid"><article><span>01</span><h3>Une relation, une provenance</h3><p>Les fiches donnent accès aux déclarations Wikidata et à leur version à l’import, ou au document officiel avec son article ou sa page. Les rôles et dates restent attachés à chaque source.</p></article><article><span>02</span><h3>Des périodes explicites</h3><p>« Même période » retient un chevauchement établi par les dates ou une même composition officielle. Les dates insuffisantes se consultent séparément ; chaque personne permet de repartir vers sa carrière complète. Une fin manquante ne signifie pas que la fonction continue.</p></article><article><span>03</span><h3>Des parcours, sans présomption</h3><p>Une période ou une institution commune ne démontre pas une rencontre. Une composition officielle, une promotion et un mandat individuel sont des preuves distinctes. Un repère ponctuel ne devient pas une présence continue.</p></article><article><span>04</span><h3>Un corpus à ses débuts</h3><p>Cette V0 couvre {data.meta.peopleCount} personnes. Elle est non exhaustive, non représentative et ne se met pas à jour en continu.</p></article></div><div className="method-note"><Info size={19} /><p>Les déclarations Wikidata ne sont pas vérifiées indépendamment ici. {wikidataRelations.filter(relation => relation.references.some(reference => reference.urls.length)).length} sur {wikidataRelations.length} comportent une URL de référence externe. Les autres restent signalées comme déclarations à recouper. {officialCount} déclarations supplémentaires proviennent de sources publiques identifiées. Les données HATVP décrivent ce qui a été déclaré à leur date de dépôt.</p></div><a className="subtle-link" href="https://www.wikidata.org/wiki/Wikidata:Data_access/fr" target="_blank" rel="noopener noreferrer">Accès aux données et licence Wikidata<ArrowUpRight size={14} /></a><p className="section-caption">Autres sources : <a href="https://data.assemblee-nationale.fr/acteurs/historique-des-deputes" target="_blank" rel="noopener noreferrer">Assemblée nationale</a> · <a href="https://www.integritywatch.fr/" target="_blank" rel="noopener noreferrer">Integrity Watch France</a> · <a href="https://www.hatvp.fr/open-data/" target="_blank" rel="noopener noreferrer">HATVP</a>.</p></Modal>}
    {modal === 'corpus' && <Modal title="Le corpus de la V0" onClose={() => setModal(null)}><p>Le corpus initial est enrichi depuis douze écoles, entreprises et organisations : jusqu’à 60 profils publics par institution, sélectionnés par identifiant Wikidata, avec une notice française. Pour les écoles, la recherche retient des parcours politiques français. Cette sélection est non exhaustive et non représentative.</p><div className="corpus-stats"><div><strong>{data.meta.peopleCount}</strong><span>personnalités</span></div><div><strong>{data.meta.entityCount}</strong><span>entités</span></div><div><strong>{data.meta.relationCount}</strong><span>déclarations</span></div></div><p className="section-caption">Import Wikidata du {importedDate} · données Wikidata sous CC0. Les documents officiels conservent leurs conditions de réutilisation.</p><input className="corpus-search" aria-label="Filtrer les personnes du corpus" value={corpusQuery} onChange={event => setCorpusQuery(event.target.value)} placeholder="Retrouver un nom dans le corpus…" /><div className="corpus-list">{filteredPeople.map(entity => <button key={entity.id} onClick={() => startFrom(entity)}><EntityAvatar entity={entity} /><span>{entity.label}</span><ArrowUpRight size={15} /></button>)}</div>{!filteredPeople.length && <p className="empty-search">Aucune personne trouvée dans ce corpus.</p>}</Modal>}
    <span className="sr-only" aria-live="polite">Vue centrée sur {shortLabel(focusEntity)}. {visible.entities.length} entités dans le réseau. {view.mode === 'graph' ? `${visible.entities.length} entités et ${visible.relations.length} déclarations affichées.` : `${visible.relations.length} déclarations dans la liste.`} {temporal === 'same' ? 'Filtre par période actif.' : 'Toutes les périodes.'}</span>
  </div>;
}

function CalendarIcon() { return <span className="period-icon" aria-hidden="true">↔</span>; }
