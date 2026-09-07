import { expect, test } from 'vitest';
import { labelLevel, placeLabels, type LabelCandidate, type LabelBox } from './graph-labels';
const measure = (text: string, size: number) => text.length * size * .55;
const overlap = (a: LabelBox, b: LabelBox) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
const nodes: LabelCandidate[] = [
  { id: 'root', text: 'Centre documenté', x: 0, y: 0, radius: 22, priority: 100, side: 'bottom' },
  { id: 'selected', text: 'Une personne sélectionnée', x: 65, y: 30, radius: 14, priority: 90, side: 'bottom' },
  { id: 'neighbor', text: 'Une institution très longue avec un intitulé complet', x: 180, y: 30, radius: 12, priority: 0, side: 'right' },
];
test('label levels have different entry and exit thresholds', () => {
  expect(labelLevel(.34, 0)).toBe(1); expect(labelLevel(.30, 1)).toBe(1); expect(labelLevel(.27, 1)).toBe(0);
  expect(labelLevel(.76, 1)).toBe(2); expect(labelLevel(.70, 2)).toBe(2); expect(labelLevel(.63, 2)).toBe(1);
});
test('center and selection remain readable without overlapping each other or other nodes', () => {
  const labels = placeLabels(nodes, { level: 1, small: false, measure });
  expect(labels.map(label => label.id)).toContain('root'); expect(labels.map(label => label.id)).toContain('selected');
  for (const label of labels) {
    expect(label.fontSize).toBeGreaterThanOrEqual(14); expect(label.fontSize).toBeLessThanOrEqual(15);
    expect(label.text.split('\n').length).toBeLessThanOrEqual(2);
    expect(labels.filter(other => other.id !== label.id).some(other => overlap(label.box, other.box))).toBe(false);
    expect(nodes.some(node => overlap(label.box, { x1: node.x - node.radius, x2: node.x + node.radius, y1: node.y - node.radius, y2: node.y + node.radius }))).toBe(false);
  }
});
test('placement is deterministic and reveals more names when spacing allows it', () => {
  const spaced = Array.from({ length: 70 }, (_, i): LabelCandidate => ({ id: String(i).padStart(2, '0'), text: `Nom ${i}`, x: i % 10 * 200, y: Math.floor(i / 10) * 100, radius: 12, priority: 0, side: 'bottom' }));
  const options = { level: 0 as const, small: false, measure };
  const overview = placeLabels(spaced, options);
  expect(overview.length).toBeGreaterThan(0); expect(overview.length).toBeLessThan(spaced.length);
  expect(placeLabels([...spaced].reverse(), options)).toEqual(overview);
  expect(placeLabels(spaced, { ...options, level: 2 })).toHaveLength(spaced.length);
});
test('labels avoid guide captions and shorten a long name without changing its source', () => {
  const source = [{ ...nodes[2], side: 'bottom' as const }];
  const obstacle = { x1: 100, x2: 270, y1: 50, y2: 120 };
  const result = placeLabels(source, { level: 2, small: true, measure, obstacles: [obstacle] });
  expect(result).toHaveLength(1); expect(overlap(result[0].box, obstacle)).toBe(false);
  expect(result[0].text).toContain('…'); expect(result[0].text.split('\n')).toHaveLength(2);
  expect(source[0].text).toBe(nodes[2].text);
});

test('the viewport changes label placement without shrinking or moving its nodes', () => {
  const source = [{ ...nodes[1], x: 145, y: 50 }];
  const viewport = { x1: 0, x2: 180, y1: 0, y2: 180 };
  const result = placeLabels(source, { level: 2, small: true, measure, viewport });
  expect(result).toHaveLength(1);
  expect(result[0].box.x1).toBeGreaterThanOrEqual(viewport.x1); expect(result[0].box.x2).toBeLessThanOrEqual(viewport.x2);
  expect(source[0].x).toBe(145);
  expect(placeLabels([{ ...source[0], x: 400 }], { level: 2, small: true, measure, viewport })).toEqual([]);
});

test('fractional screen coordinates do not hide unobstructed names in a spacious overview', () => {
  for (let i = 0; i < 40; i++) {
    const source: LabelCandidate[] = [{ id: 'school', text: 'Sciences Po Paris', x: 544.923076923 + i / 13, y: -92 + i / 17, radius: 17, priority: 0, side: 'bottom' }];
    const result = placeLabels(source, { level: 0, small: false, prominent: true, measure: (text, size) => measure(text, size) + i / 37, viewport: { x1: -481.154, x2: 912.846, y1: -219, y2: 219 } });
    expect(result).toHaveLength(1);
    expect(result[0].side).toBe('bottom');
    expect(result[0].fontSize).toBe(16);
  }
});
