import { expect, test } from 'vitest';
import { labelLevel, placeLabels, type LabelCandidate, type LabelBox } from './graph-labels';
import { atlasLabelStyle } from './graph-theme';
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

test('a system label budget stays bounded at close zoom and preserves the selected name', () => {
  const source: LabelCandidate[] = Array.from({ length: 100 }, (_, i) => ({ id: `n${i}`, text: `Name ${i}`, x: i * 200, y: 0, radius: 3, priority: i === 99 ? 100 : 0, side: 'bottom' }));
  const result = placeLabels(source, { level: 2, small: false, measure, cartographic: true, maxLabels: 20, maxCandidates: 40 });
  expect(result).toHaveLength(20);
  expect(result.map(label => label.id)).toContain('n99');
});

test('dense systems stop trying hidden names after the candidate budget is spent', () => {
  const source: LabelCandidate[] = Array.from({ length: 1000 }, (_, i) => ({ id: `n${i}`, text: `Name${i}`, x: 0, y: 0, radius: 3, priority: 0, side: 'bottom' }));
  const measured = new Set<string>();
  const result = placeLabels(source, { level: 2, small: false, cartographic: true, maxCandidates: 40,
    measure: (text, size) => { measured.add(text.trim()); return measure(text, size); },
    obstacles: [{ x1: -500, x2: 500, y1: -500, y2: 500 }],
  });
  expect(result).toEqual([]);
  expect(measured.size).toBeLessThanOrEqual(40);
});

test('collision lookup respects nearby obstacles across negative grid boundaries', () => {
  const source: LabelCandidate[] = [{ id: 'name', text: 'Alice', x: -64, y: -64, radius: 3, priority: 0, side: 'bottom' }];
  const obstacle = { x1: -90, x2: -35, y1: -55, y2: -20 };
  const result = placeLabels(source, { level: 2, small: false, measure, obstacles: [obstacle] });
  expect(result).toHaveLength(1);
  expect(overlap(result[0].box, obstacle)).toBe(false);
  expect(result[0].side).toBe('top');
});

test('a dense central cluster cannot spend the entire budget before a readable peripheral name', () => {
  const source: LabelCandidate[] = Array.from({ length: 100 }, (_, i) => ({ id: `n${i}`, text: `Name${i}`, x: 0, y: 0, radius: 3, priority: 10, side: 'bottom' }));
  source.push({ id: 'periphery', text: 'Peripheral institution', x: 400, y: 0, radius: 3, priority: 1, side: 'bottom' });
  const result = placeLabels(source, { level: 2, small: false, measure, maxCandidates: 10 });
  expect(result.map(label => label.id)).toContain('periphery');
});

test('cartographic landmarks never override occupied space, even for the selection', () => {
  const source: LabelCandidate[] = Array.from({ length: 12 }, (_, i) => ({ id: `hub${i}`, text: 'Institution documentée', x: 150, y: 100, radius: 5, priority: i === 0 ? 100 : 65, side: 'bottom' }));
  const result = placeLabels(source, { level: 0, small: false, measure, cartographic: true, maxLabels: 3, viewport: { x1: 0, y1: 0, x2: 300, y2: 200 } });
  expect(result.map(label => label.id)).toContain('hub0');
  expect(result.length).toBeLessThanOrEqual(3);
  for (const label of result) {
    const breathingRoom = { x1: label.box.x1 - 6, y1: label.box.y1 - 6, x2: label.box.x2 + 6, y2: label.box.y2 + 6 };
    expect(result.some(other => other.id !== label.id && overlap(breathingRoom, other.box))).toBe(false);
  }
  expect(placeLabels(source, { level: 0, small: false, measure, cartographic: true, obstacles: [{ x1: -1000, y1: -1000, x2: 1000, y2: 1000 }] })).toEqual([]);
});

test('cartographic labels reveal detail progressively without bypassing the overview budget', () => {
  const source: LabelCandidate[] = Array.from({ length: 80 }, (_, i) => ({ id: `hub${i}`, text: `Institution ${i}`, x: i % 10 * 220, y: Math.floor(i / 10) * 120, radius: 5, priority: 65, side: 'bottom' }));
  const counts = ([0, 1, 2] as const).map(level => placeLabels(source, { level, small: false, measure, cartographic: true, maxLabels: 60 }).length);
  expect(counts[0]).toBeGreaterThan(0);
  expect(counts[0]).toBeLessThanOrEqual(18);
  expect(counts[1]).toBeGreaterThan(counts[0]);
  expect(counts[2]).toBeGreaterThan(counts[1]);
  expect(counts[2]).toBeLessThanOrEqual(60);
});

test('cartographic rendering keeps the measured box centered at every zoom and near viewport edges', () => {
  const source = [{ ...nodes[1], x: 20, y: 30, text: 'Une institution au nom très long' }];
  const viewport = { x1: 0, y1: 0, x2: 280, y2: 180 };
  const [label] = placeLabels(source, { level: 1, small: true, compact: true, cartographic: true, measure, viewport });
  expect(label).toBeDefined();
  expect(label.text.split('\n')).toHaveLength(2);
  expect(label.box.x1).toBeGreaterThanOrEqual(0);
  expect(label.box.x2).toBeLessThanOrEqual(280);
  for (const zoom of [.08, .3, 1, 3]) {
    const style = atlasLabelStyle(label, zoom, true);
    expect(style['text-halign']).toBe('center');
    expect(style['text-valign']).toBe('center');
    expect(source[0].x + Number(style['text-margin-x']) * zoom).toBeCloseTo((label.box.x1 + label.box.x2) / 2);
    expect(source[0].y + Number(style['text-margin-y']) * zoom).toBeCloseTo((label.box.y1 + label.box.y2) / 2);
    expect(Number(style['font-size']) * zoom).toBeCloseTo(label.fontSize);
    expect(Number(style['text-max-width']) * zoom).toBeGreaterThan(label.box.x2 - label.box.x1);
  }
});
