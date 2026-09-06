import { describe, expect, it } from 'vitest';
import { loadDataset } from './dataset';
import original from '../data/graph.json';

describe('sourced Attali enrichment', () => {
  it('adds political participants with navigable sourced careers without replacing the original statements', () => {
    const data = loadDataset();
    expect(data.entities.find(entity => entity.id === 'Q74191')?.inCorpus).toBe(true);
    expect(data.relations.some(relation => relation.source === 'Q74191' && relation.category === 'office')).toBe(true);
    for (const relation of original.relations) expect(data.relations.find(item => item.id === relation.id)).toEqual(relation);
    expect(new Set(data.entities.map(entity => entity.id)).size).toBe(data.entities.length);
    expect(new Set(data.relations.map(relation => relation.id)).size).toBe(data.relations.length);
    expect(data.meta.peopleCount).toBe(data.entities.filter(entity => entity.inCorpus && entity.type === 'person').length);
    const ids = new Set(data.entities.map(entity => entity.id));
    expect(data.relations.every(relation => ids.has(relation.source) && ids.has(relation.target))).toBe(true);
    for (const relation of data.relations.filter(relation => !relation.evidence)) {
      expect(relation.statementUrl).toMatch(/^https:\/\/www\.wikidata\.org\/wiki\/Q\d+#/);
      expect(relation.revisionUrl).toMatch(/oldid=\d+$/);
    }
  });
  it('keeps the actual role change and the independently documented compositions separate', () => {
    const data = loadDataset();
    const initial = data.relations.filter(relation => relation.cohort?.id === 'attali-2007');
    const later = data.relations.filter(relation => relation.cohort?.id === 'attali-2010');
    expect(initial.find(relation => relation.source === 'Q3052772')?.role).toBe('Rapporteur général adjoint');
    expect(later.find(relation => relation.source === 'Q3052772')?.role).toBe('Membre');
    expect(initial.some(relation => relation.source === 'Q438185')).toBe(true);
    expect(later.some(relation => relation.source === 'Q438185')).toBe(false);
    // Mario Monti is listed among people heard in 2010, not in that report's member roster.
    expect(later.some(relation => relation.source === 'Q47904')).toBe(false);
    expect(later.find(relation => relation.source === 'Q74191')?.statementUrl).toContain('#page=213');
  });
  it('provides primary evidence without fabricated Wikidata statements or tenure dates', () => {
    const data = loadDataset();
    const official = data.relations.filter(relation => relation.evidence);
    expect(official.length).toBeGreaterThan(0);
    for (const relation of official) {
      expect(relation.revisionUrl).toBeUndefined();
      expect(relation.start).toBeUndefined();
      expect(relation.end).toBeUndefined();
      expect(['www.legifrance.gouv.fr', 'www.vie-publique.fr']).toContain(new URL(relation.statementUrl).hostname);
      expect(data.entities.some(entity => entity.id === relation.source && entity.inCorpus)).toBe(true);
      expect(relation.evidence?.locator).toBeTruthy();
      expect(relation.pointInTime).toBeDefined();
    }
  });
});
