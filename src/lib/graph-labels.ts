export type LabelLevel = 0 | 1 | 2;
export type LabelSide = 'top' | 'bottom' | 'left' | 'right';
export interface LabelBox { x1: number; y1: number; x2: number; y2: number }
export interface LabelCandidate { id: string; text: string; x: number; y: number; radius: number; priority: number; side: LabelSide }
export interface LabelPlacement { id: string; text: string; side: LabelSide; offset: number; shiftX: number; shiftY: number; fontSize: number; box: LabelBox }
export interface LabelOptions { level: LabelLevel; small: boolean; prominent?: boolean; compact?: boolean; measure: (text: string, size: number, bold: boolean) => number; obstacles?: LabelBox[]; previous?: Set<string>; viewport?: LabelBox }
export function labelLevel(zoom: number, previous: LabelLevel): LabelLevel {
  if (zoom >= .75 || previous === 2 && zoom >= .66) return 2;
  if (zoom >= .33 || previous >= 1 && zoom >= .28) return 1;
  return 0;
}

function intersection(a: LabelBox, b: LabelBox, margin = 3) {
  return Math.max(0, Math.min(a.x2, b.x2 + margin) - Math.max(a.x1, b.x1 - margin)) * Math.max(0, Math.min(a.y2, b.y2 + margin) - Math.max(a.y1, b.y1 - margin));
}

function wrap(text: string, maxWidth: number, measure: (text: string) => number) {
  const words = text.trim().split(/\s+/), lines: string[] = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const next = `${line} ${words[i]}`.trim();
    if (measure(next) <= maxWidth) { line = next; continue; }
    if (!lines.length && line) { lines.push(line); line = words[i]; continue; }
    line = next;
    while (line.length && measure(`${line}…`) > maxWidth) line = line.slice(0, -1);
    lines.push(`${line.trimEnd()}…`);
    return lines;
  }
  if (line) lines.push(line);
  return lines;
}

/** Screen-sized geometry, independent of camera translation. Never removes an entity. */
export function placeLabels(nodes: LabelCandidate[], options: LabelOptions): LabelPlacement[] {
  const ordered = [...nodes].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const bodies = nodes.map(node => ({ x1: node.x - node.radius, x2: node.x + node.radius, y1: node.y - node.radius, y2: node.y + node.radius }));
  const occupied: LabelBox[] = [...(options.obstacles ?? [])], result: LabelPlacement[] = [];
  const limit = options.prominent || options.level === 2 ? Infinity : options.level === 1 ? 46 : nodes.length <= 28 ? 12 : 18;
  for (const node of ordered) {
    const essential = node.priority >= 60;
    if (options.viewport && (node.x + node.radius < options.viewport.x1 || node.x - node.radius > options.viewport.x2 || node.y + node.radius < options.viewport.y1 || node.y - node.radius > options.viewport.y2)) continue;
    if (!essential && result.length >= limit) continue;
    const fontSize = options.prominent ? node.priority === 100 ? options.compact ? 18 : 20 : options.compact ? 14 : 16 : node.priority >= 80 ? 15 : 14;
    const measure = (text: string) => options.measure(text, fontSize, essential);
    const lines = wrap(node.text, options.compact ? node.priority === 100 ? 120 : essential ? 180 : 132 : options.prominent && !essential ? 146 : options.small ? essential ? 170 : 132 : essential ? 210 : 150, measure);
    const text = lines.join('\n'), width = Math.max(...lines.map(measure), 1) + 6, height = lines.length * fontSize * 1.2 + 6;
    const sides = [...new Set<LabelSide>([node.side, 'bottom', 'top', 'right', 'left'])];
    const shifts = options.prominent ? [0, -12, 12, -24, 24, -48, 48] : [0];
    const choices = sides.flatMap(side => shifts.map(shift => ({ side, shift })));
    let best: LabelPlacement | undefined, minimum = Infinity;
    for (const extra of essential || options.prominent ? [0, 12, 24] : [0]) {
      for (const { side, shift } of choices) {
        const offset = 8 + extra;
        let x = side === 'right' ? node.x + node.radius + offset : side === 'left' ? node.x - node.radius - offset - width : node.x - width / 2;
        let y = side === 'bottom' ? node.y + node.radius + offset : side === 'top' ? node.y - node.radius - offset - height : node.y - height / 2;
        const origin = { x, y };
        if (side === 'top' || side === 'bottom') x += shift;
        else y += shift;
        // At the viewport edge, slide a name along its chosen side. The node stays
        // fixed, and an exploration-step label need not cross the nearby center.
        if (options.viewport) {
          if (side === 'top' || side === 'bottom') x = Math.max(options.viewport.x1, Math.min(x, options.viewport.x2 - width));
          else y = Math.max(options.viewport.y1, Math.min(y, options.viewport.y2 - height));
        }
        const box = { x1: x, x2: x + width, y1: y, y2: y + height };
        // A little more room is needed for a new name than for one already visible.
        const margin = options.previous?.has(node.id) ? 2 : 4;
        const viewport = options.viewport;
        // Test containment first: subtracting fractional areas can penalize a
        // fully visible label with a tiny positive floating-point remainder.
        const outside = viewport && (box.x1 < viewport.x1 || box.x2 > viewport.x2 || box.y1 < viewport.y1 || box.y2 > viewport.y2)
          ? Math.max(0, width * height - intersection(box, viewport, 0)) : 0;
        const cost = occupied.reduce((sum, obstacle) => sum + intersection(box, obstacle, margin), 0) + bodies.reduce((sum, body) => sum + intersection(box, body, 3) * 3, 0) + outside * 8;
        if (cost < minimum) { minimum = cost; best = { id: node.id, text, side, offset, shiftX: x - origin.x, shiftY: y - origin.y, fontSize, box }; }
        if (minimum === 0) break;
      }
      if (minimum === 0) break;
    }
    if (best && (minimum === 0 || essential)) { result.push(best); occupied.push(best.box); }
  }
  return result;
}
