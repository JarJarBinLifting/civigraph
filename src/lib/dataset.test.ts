import { describe, expect, it } from 'vitest';
import dataset from '../data/graph.json';
import { CATEGORIES, type GraphData } from './types';
import { searchEntities } from './graph';

const data = dataset as GraphData;

describe('committed Wikidata corpus', () => {
  it('finds an institution by the short name used on the graph', () => {
    expect(searchEntities(data, 'ENA')[0].id).toBe('Q273579');
    expect(searchEntities(data, 'Sciences Po')[0].id).toBe('Q859363');
  });
  it('contains 30–50 distinct sourced people with consistent published counts', () => {
    const people = data.entities.filter(entity => entity.inCorpus && entity.type === 'person');
    expect(people.length).toBeGreaterThanOrEqual(30);
    expect(people.length).toBeLessThanOrEqual(50);
    expect(new Set(data.entities.map(entity => entity.id)).size).toBe(data.entities.length);
    expect(data.meta.peopleCount).toBe(people.length);
    expect(data.meta.entityCount).toBe(data.entities.length);
    expect(data.meta.relationCount).toBe(data.relations.length);
    expect(data.entities.every(entity => entity.label !== entity.id && (entity.revision ?? 0) > 0)).toBe(true);
  });

  it('has no dangling edges and a real statement and fixed revision for every relationship', () => {
    const ids = new Set(data.entities.map(entity => entity.id));
    expect(new Set(data.relations.map(relation => relation.id)).size).toBe(data.relations.length);
    for (const relation of data.relations) {
      expect(ids.has(relation.source) && ids.has(relation.target)).toBe(true);
      expect(relation.id.toUpperCase().startsWith(`${relation.source}$`)).toBe(true);
      expect(relation.statementUrl).toContain(`${relation.source}#${relation.id.replace('$', '-')}`);
      expect(new URL(relation.revisionUrl!).searchParams.get('oldid')).toMatch(/^\d+$/);
      expect(CATEGORIES).toContain(relation.category);
      for (const reference of relation.references) for (const url of reference.urls) expect(['http:', 'https:']).toContain(new URL(url).protocol);
    }
  });
});
