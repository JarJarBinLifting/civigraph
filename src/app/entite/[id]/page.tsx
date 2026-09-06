import { cache } from 'react';
import { notFound } from 'next/navigation';
import { loadDataset } from '@/lib/dataset';
import { getGraphIndex } from '@/lib/graph-index';
import { getCareerTimeline, getPersonProfile } from '@/lib/profile';
import { categoryInfo, formatDate, periodLabel, typeInfo } from '@/lib/presentation';
import { documentMetadata, eligibleEntity, entityPath } from '@/lib/publication';
import { DocumentLayout } from '@/components/DocumentLayout';

export const dynamic = 'force-dynamic';
const dataset = cache(loadDataset);
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = dataset(), entity = getGraphIndex(data).entities.get(id);
  if (!entity) notFound();
  return documentMetadata(entity.label, entity.description || `Relations documentées de ${entity.label} dans le corpus Civigraph. Sources et périodes disponibles.`, entityPath(id), eligibleEntity(entity, data));
}

export default async function EntityDocument({ params }: Props) {
  const { id } = await params;
  const data = dataset(), index = getGraphIndex(data), entity = index.entities.get(id);
  if (!entity) notFound();
  const relations = index.incident.get(id) ?? [];
  const neighbors = new Set(relations.map(relation => relation.source === id ? relation.target : relation.source));
  const profile = entity.type === 'person' ? getPersonProfile(data, entity) : null;
  const career = entity.type === 'person' ? getCareerTimeline(data, entity) : null;
  const careerSections = career ? [{ heading: 'Passages datés', entries: career.dated }, { heading: 'Sans dates exploitables', entries: career.undated }] : [];
  return <DocumentLayout>
    <div className="document-title"><p className="eyebrow">Notice documentaire · {typeInfo[entity.type].label}</p><h1>{entity.label}</h1><p>{entity.description}</p><a className="primary-button" href={`/?root=${encodeURIComponent(id)}&time=all`}>Explorer ce réseau</a></div>
    <div className="document-statistics"><span><strong>{neighbors.size}</strong> entités liées</span><span><strong>{relations.length}</strong> déclarations</span><span>Instantané du {new Date(data.meta.supplementedAt ?? data.meta.fetchedAt).toLocaleDateString('fr-FR', { timeZone: 'UTC' })}</span></div>
    <p className="document-limit">Cette notice reprend les informations du corpus. Les déclarations Wikidata ne sont pas vérifiées indépendamment. Plusieurs déclarations peuvent documenter le même fait ; leur nombre n’est pas un nombre de relations personnelles.</p>
    {(entity.wikidataUrl || entity.sourceUrl) && <a className="document-source" href={entity.wikidataUrl ?? entity.sourceUrl} target="_blank" rel="noopener noreferrer">{entity.wikidataUrl ? 'Fiche Wikidata de cette entité' : entity.sourceLabel ?? 'Source de cette entité'} ↗</a>}
    {entity.labelSource && <p><a className="document-source" href={entity.labelSource.url} target="_blank" rel="noopener noreferrer">{entity.labelSource.title} ↗</a></p>}
    {profile && <section className="document-overview"><h2>Repères du parcours</h2>{profile.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<p>Ces repères restent indépendants des filtres de la carte. Une fin absente ne signifie pas « en poste ».</p></section>}
    {career && <section className="document-career"><h2>Parcours chronologique</h2><p>Les activités peuvent être concomitantes. Les bornes manquantes ne sont pas complétées.</p>{careerSections.map(({ heading, entries }) => entries.length > 0 && <div key={heading}><h3>{heading}</h3><ol>{entries.map(entry => <li key={entry.key}><span>{periodLabel(entry.relations[0])}</span><div><small>{categoryInfo[entry.category].singular}</small><a href={entityPath(entry.entity.id)}>{entry.entity.label}</a>{entry.relations[0].role && <p>{entry.relations[0].role}</p>}{entry.relations.map((relation, i) => <a key={relation.id} className="document-source" href={`#relation-${encodeURIComponent(relation.id)}`}>Consulter la source {entry.relations.length > 1 ? i + 1 : ''} de ce passage</a>)}</div></li>)}</ol></div>)}</section>}
    <section className="document-relations"><h2>Relations et sources</h2><p>Chaque déclaration garde son sens, sa période et sa provenance. Cliquez sur un titre pour consulter ses références.</p>{relations.map(relation => {
      const source = index.entities.get(relation.source)!, target = index.entities.get(relation.target)!;
      const references = [...new Set(relation.references.flatMap(reference => reference.urls))];
      const statedIn = [...new Set(relation.references.flatMap(reference => reference.statedIn))];
      const importedFrom = [...new Set(relation.references.flatMap(reference => reference.importedFrom))];
      return <details className="document-relation" key={relation.id} id={`relation-${encodeURIComponent(relation.id)}`}>
        <summary><span className="eyebrow">{categoryInfo[relation.category].singular}</span><strong>{source.label} · {relation.label.toLowerCase()} · {target.label}</strong><small>{periodLabel(relation)}</small></summary>
        {relation.role && <p>{relation.role}</p>}
        {relation.contexts?.length ? <p>Périmètre : {relation.contexts.map(context => context.label).join(' · ')}</p> : null}
        {relation.evidence && <><p>{relation.evidence.title} · {relation.evidence.locator}</p><p>{relation.evidence.note}</p></>}
        <div className="document-links"><a href={entityPath(source.id)}>{source.label} : notice</a><a href={entityPath(target.id)}>{target.label} : notice</a><a href={relation.statementUrl} target="_blank" rel="noopener noreferrer">{relation.evidence ? 'Consulter le document source' : 'Déclaration Wikidata'} ↗</a>{relation.revisionUrl && <a href={relation.revisionUrl} target="_blank" rel="noopener noreferrer">Version lors de l’import ↗</a>}{references.filter(url => url !== relation.statementUrl.split('#')[0]).map((url, i) => <a key={url} href={url} target="_blank" rel="noopener noreferrer">Référence {i + 1} · {new URL(url).hostname} ↗</a>)}</div>
        {(statedIn.length > 0 || importedFrom.length > 0) && <div className="document-links">{statedIn.map(id => <a key={`publication-${id}`} href={`https://www.wikidata.org/wiki/${id}`} target="_blank" rel="noopener noreferrer">Publication citée · {id} ↗</a>)}{importedFrom.map(id => <a key={`import-${id}`} href={`https://www.wikidata.org/wiki/${id}`} target="_blank" rel="noopener noreferrer">Importé depuis · {id} ↗</a>)}</div>}
        {relation.references.filter(reference => reference.retrieved).map(reference => <small key={reference.id}>Référence consultée le {formatDate(reference.retrieved)}.</small>)}
        {!relation.evidence && !references.length && <p className="document-limit">Pas d’URL de référence externe fournie par Wikidata. Déclaration à recouper.</p>}
      </details>;
    })}{!relations.length && <p>Aucune relation disponible pour cette entité dans l’instantané.</p>}</section>
  </DocumentLayout>;
}
