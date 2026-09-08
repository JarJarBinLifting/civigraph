import snapshot from '../data/cabinet-rosters.json';
import type { Entity, GraphData, Relation } from './types';

export function cabinetDataset(): GraphData {
  const entities = new Map<string, Entity>();
  const relations: Relation[] = [];
  for (const roster of snapshot.rosters) {
    const target = `cabinet:${roster.id}`;
    const origin = { modified: snapshot.checkedAt, sourceUrl: roster.source, sourceLabel: 'Journal officiel · Légifrance' };
    entities.set(target, { ...origin, id: target, label: roster.label, description: roster.note, type: 'organization', inCorpus: false });
    const evidence = { kind: 'official' as const, title: roster.title, locator: 'Article 1', note: roster.note, checkedAt: snapshot.checkedAt };
    const base = { target, pointInTime: { value: roster.date, precision: 11 }, statementUrl: roster.source, references: [{ id: roster.id, urls: [roster.source], statedIn: [], importedFrom: [] }], evidence };
    for (const person of roster.participants) {
      if (!entities.has(person.id)) entities.set(person.id, { ...origin, id: person.id, label: person.label, description: 'Parcours partiel documenté par les nominations officielles du corpus.', type: 'person', inCorpus: true });
      relations.push({ ...base, id: `${roster.id}:${person.id}`, source: person.id, property: 'official:cabinet', category: 'employment', label: 'A été nommé dans', role: person.role, cohort: { id: roster.id, label: roster.label } });
    }
    // The minister is the supervising officeholder, not a member of their own staff roster.
    relations.push({ ...base, evidence: { ...evidence, locator: 'Qualité du signataire de l’arrêté' }, id: `${roster.id}:minister`, source: roster.leader, property: 'official:cabinet-supervision', category: 'office', label: 'Ministre de rattachement de', role: 'Ministre signataire de l’arrêté' });
  }
  return { entities: [...entities.values()], relations, meta: { version: 1, fetchedAt: snapshot.checkedAt, source: 'Journal officiel · nominations aux cabinets', license: 'Licence ouverte', description: 'Deux repères de nomination, couverture partielle.', peopleCount: [...entities.values()].filter(e => e.type === 'person').length, entityCount: entities.size, relationCount: relations.length, properties: ['official:cabinet', 'official:cabinet-supervision'] } };
}
