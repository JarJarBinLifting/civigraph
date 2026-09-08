export type LabelLevel = 0 | 1 | 2;
export type LabelSide = 'top' | 'bottom' | 'left' | 'right';
export interface LabelBox { x1: number; y1: number; x2: number; y2: number }
export interface LabelCandidate { id: string; text: string; x: number; y: number; radius: number; priority: number; side: LabelSide }
export interface LabelPlacement { id: string; text: string; side: LabelSide; offset: number; shiftX: number; shiftY: number; fontSize: number; box: LabelBox; centerOffset?: { x: number; y: number } }
export interface LabelOptions { level: LabelLevel; small: boolean; prominent?: boolean; compact?: boolean; cartographic?: boolean; measure: (text: string, size: number, bold: boolean) => number; obstacles?: LabelBox[]; previous?: Set<string>; viewport?: LabelBox; maxLabels?: number; maxCandidates?: number }
export function labelLevel(zoom: number, previous: LabelLevel): LabelLevel {
  if (zoom >= .75 || previous === 2 && zoom >= .66) return 2;
  if (zoom >= .33 || previous >= 1 && zoom >= .28) return 1;
  return 0;
}

function intersection(a: LabelBox, b: LabelBox, margin = 3) {
  return Math.max(0, Math.min(a.x2, b.x2 + margin) - Math.max(a.x1, b.x1 - margin)) * Math.max(0, Math.min(a.y2, b.y2 + margin) - Math.max(a.y1, b.y1 - margin));
}

/** Only nearby rectangles can overlap a label. Preserve insertion order for ties. */
class BoxIndex {
  private boxes: LabelBox[] = [];
  private cells = new Map<string, number[]>();
  private visit(box: LabelBox, margin: number, action: (key: string) => void) {
    for (let x = Math.floor((box.x1 - margin) / 64); x <= Math.floor((box.x2 + margin) / 64); x++) {
      for (let y = Math.floor((box.y1 - margin) / 64); y <= Math.floor((box.y2 + margin) / 64); y++) action(`${x}:${y}`);
    }
  }
  add(box: LabelBox) {
    const id = this.boxes.push(box) - 1;
    this.visit(box, 0, key => {
      const cell = this.cells.get(key);
      if (cell) cell.push(id); else this.cells.set(key, [id]);
    });
  }
  overlap(box: LabelBox, margin: number) {
    const ids = new Set<number>();
    this.visit(box, margin, key => { for (const id of this.cells.get(key) ?? []) ids.add(id); });
    let cost = 0;
    for (const id of [...ids].sort((a, b) => a - b)) cost += intersection(box, this.boxes[id], margin);
    return cost;
  }
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
  let ordered = [...nodes].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  if (options.maxCandidates !== undefined) {
    // Reserve attempts across the screen before revisiting a crowded cell.
    const cells = new Set<string>(), first: LabelCandidate[] = [], rest: LabelCandidate[] = [];
    for (const node of ordered) {
      const key = `${Math.floor(node.x / 64)}:${Math.floor(node.y / 64)}`;
      if (node.priority >= 60 || !cells.has(key)) { first.push(node); cells.add(key); }
      else rest.push(node);
    }
    ordered = [...first, ...rest];
  }
  const bodies = new BoxIndex(), occupied = new BoxIndex(), result: LabelPlacement[] = [];
  nodes.forEach(node => bodies.add({ x1: node.x - node.radius, x2: node.x + node.radius, y1: node.y - node.radius, y2: node.y + node.radius }));
  options.obstacles?.forEach(box => occupied.add(box));
  const limit = Math.min(options.maxLabels ?? Infinity, options.prominent || options.level === 2 ? Infinity : options.level === 1 ? 46 : nodes.length <= 28 ? 12 : 18);
  let attempted = 0;
  for (const node of ordered) {
    const essential = node.priority >= 60;
    if (options.viewport && (node.x + node.radius < options.viewport.x1 || node.x - node.radius > options.viewport.x2 || node.y + node.radius < options.viewport.y1 || node.y - node.radius > options.viewport.y2)) continue;
    if ((options.cartographic || !essential) && result.length >= limit) continue;
    if ((options.cartographic || !essential) && attempted >= (options.maxCandidates ?? Infinity)) break;
    attempted++;
    const fontSize = options.prominent ? node.priority === 100 ? options.compact ? 18 : 20 : options.compact ? 15 : 16 : node.priority >= 80 ? 15 : 14;
    const measure = (text: string) => options.measure(text, fontSize, essential);
    const lines = wrap(node.text, options.compact ? node.priority === 100 ? 120 : essential ? 180 : 132 : options.prominent && !essential ? 182 : options.small ? essential ? 170 : 132 : essential ? 210 : 150, measure);
    const text = lines.join('\n'), width = Math.max(...lines.map(measure), 1) + 6, height = lines.length * fontSize * 1.2 + 6;
    const sides = [...new Set<LabelSide>([node.side, 'bottom', 'top', 'right', 'left'])];
    const shifts = options.prominent ? [0, -12, 12, -24, 24, -48, 48] : options.cartographic ? [0, -12, 12, -24, 24] : [0];
    const choices = sides.flatMap(side => shifts.map(shift => ({ side, shift })));
    let best: LabelPlacement | undefined, minimum = Infinity;
    for (const extra of essential || options.prominent || options.cartographic ? [0, 12, 24] : [0]) {
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
        const margin = options.cartographic ? options.level === 0 ? 10 : 6 : options.previous?.has(node.id) ? 2 : 4;
        const viewport = options.viewport;
        // Test containment first: subtracting fractional areas can penalize a
        // fully visible label with a tiny positive floating-point remainder.
        const outside = viewport && (box.x1 < viewport.x1 || box.x2 > viewport.x2 || box.y1 < viewport.y1 || box.y2 > viewport.y2)
          ? Math.max(0, width * height - intersection(box, viewport, 0)) : 0;
        const hardCost = occupied.overlap(box, margin) + outside * 8;
        // On the system map, names and viewport boundaries are hard constraints.
        // Prefer whitespace among the small dots, but never force two names to overlap.
        if (options.cartographic && hardCost > 0) continue;
        const cost = hardCost + bodies.overlap(box, 3) * 3;
        if (cost < minimum) {
          minimum = cost;
          best = { id: node.id, text, side, offset, shiftX: x - origin.x, shiftY: y - origin.y, fontSize, box,
            ...(options.cartographic ? { centerOffset: { x: (box.x1 + box.x2) / 2 - node.x, y: (box.y1 + box.y2) / 2 - node.y } } : {}),
          };
        }
        if (minimum === 0) break;
      }
      if (minimum === 0) break;
    }
    if (best && (options.cartographic || minimum === 0 || essential)) { result.push(best); occupied.add(best.box); }
  }
  return result;
}
