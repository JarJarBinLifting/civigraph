import { describe, expect, it } from 'vitest';
import type { Entity, GraphData, Relation } from './types';
import { institutionParticipation, institutionBridges, sharedInstitutions, passageOverlap } from './system-analysis';
import { parseView, serializeView } from './graph';

const entity = (id: string, type: Entity['type'], contexts?: Entity['contexts']): Entity => ({ id, label: id, type, contexts, inCorpus: true, description: '', modified: '' });
const relation = (id: string, source: string, target: string, start?: string, end?: string): Relation => ({ id, source, target, category: 'education', property: 'P69', label: 'Formation', references: [], statementUrl: `https://example.org/${id}`, ...(start ? { start: { value: `${start}-01-01`, precision: 11 } } : {}), ...(end ? { end: { value: `${end}-12-31`, precision: 11 } } : {}) });
const entities = [entity('a', 'person'), entity('b', 'person'), entity('c', 'person'), entity('s', 'school'), entity('t', 'organization'), entity('generic', 'office'), entity('contextual', 'office', [{ property: 'P642', id: 'x', label: 'cabinet', revision: 1 }])];
const relations = [relation('as', 'a', 's', '2000', '2004'), relation('as2', 'a', 's'), relation('bs', 'b', 's', '2002', '2005'), relation('cs', 'c', 's', '2010', '2012'), relation('at', 't', 'a'), relation('bt', 'b', 't'), relation('generic', 'a', 'generic'), relation('context', 'a', 'contextual')];
const data: GraphData = { entities, relations, meta: { version: 1, fetchedAt: '', source: '', license: '', description: '', properties: [], peopleCount: 3, entityCount: 7, relationCount: 8 } };

describe('institutional reading', () => {
  it('counts distinct people, preserves all statements and accepts both edge directions', () => {
    const records = institutionParticipation(data);
    expect(records.find(r => r.entity.id === 's')!.people.size).toBe(3);
    expect(records.find(r => r.entity.id === 's')!.people.get('a')!.map(r => r.id)).toEqual(['as', 'as2']);
    expect(records.find(r => r.entity.id === 't')!.people.has('a')).toBe(true);
    expect(records.map(r => r.entity.id)).not.toContain('generic');
    expect(records.map(r => r.entity.id)).toContain('contextual');
  });
  it('requires all or at least two distinct selected people without counting duplicates', () => {
    const records = institutionParticipation(data);
    expect(sharedInstitutions(records, ['a', 'b', 'c'], 'all').map(r => r.entity.id)).toEqual(['s']);
    expect(sharedInstitutions(records, ['a', 'b', 'c'], 'two').map(r => r.entity.id)).toEqual(['s', 't']);
    expect(sharedInstitutions(records, ['a', 'a'], 'two')).toEqual([]);
    expect(sharedInstitutions(records, ['a', 'missing'], 'all')).toEqual([]);
  });
  it('weights institution bridges by people rather than declarations', () => {
    const bridges = institutionBridges(institutionParticipation(data));
    const bridge = bridges.find(b => b.source === 's' && b.target === 't')!;
    expect(bridge.people.sort()).toEqual(['a', 'b']);
    expect(new Set(bridge.people).size).toBe(2);
  });
  it('does not invent participation when category or temporal filtering removes evidence', () => {
    expect(institutionParticipation({ ...data, relations: [] })).toEqual([]);
    expect(institutionBridges(institutionParticipation({ ...data, relations: relations.slice(0, 4) }))).toEqual([]);
  });
  it('keeps uncertain and disjoint periods separate from documented overlap', () => {
    expect(passageOverlap([relations[0]], [relations[2]])).toEqual({ documented: 1, possible: 0, outside: 0, unknown: 0 });
    expect(passageOverlap([relations[0]], [relations[3]])).toEqual({ documented: 0, possible: 0, outside: 1, unknown: 0 });
    expect(passageOverlap([relations[1]], [relations[2]])).toEqual({ documented: 0, possible: 0, outside: 0, unknown: 1 });
  });
});

describe('shareable systemic reading', () => {
  it('restores group, threshold, display and institutional drilldown', () => {
    const base = parseView('?graphView=system', data);
    const state = { ...base, systemLens: 'common' as const, group: ['a', 'b', 'c'], commonThreshold: 'all' as const, commonDisplay: 'matrix' as const, institution: 's', bridge: 't' };
    expect(parseView(serializeView(state), data)).toEqual(state);
  });
  it('rejects invalid group and institution IDs in shared URLs', () => {
    const state = parseView('?graphView=system&systemLens=common&group=a,a,s,b,missing&institution=a&bridge=generic', data);
    expect(state.group).toEqual(['a', 'b']);
    expect(state.institution).toBeUndefined();
    expect(state.bridge).toBeUndefined();
  });
});
