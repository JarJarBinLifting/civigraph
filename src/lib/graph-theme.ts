import type { StylesheetStyle } from 'cytoscape';
import type { Entity } from './types';
import { initials, typeInfo } from './presentation';
import type { LabelPlacement } from './graph-labels';

export const atlasTheme = { paper: '#fafbf8', ink: '#26372f', forest: '#254d40', secondary: '#9b713c' };

// Diagram symbols describe entity types. Existing photographs remain in the sourced profiles.
export function nodeSymbol(entity: Entity, anchor = false) {
  const color = anchor ? '#ffffff' : typeInfo[entity.type].color;
  const content = entity.type === 'person'
    ? `<text x="32" y="42" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="600" stroke="none" fill="${color}">${initials(entity.label).replace(/[<>&"']/g, '')}</text>`
    : entity.type === 'school' ? '<path d="m12 25 20-10 20 10-20 10-20-10m8 5v13c8 6 16 6 24 0V30M52 26v16"/>'
    : entity.type === 'office' ? '<path d="m12 24 20-10 20 10H12m6 6v16m9-16v16m10-16v16m9-16v16M12 51h40"/>'
    : entity.type === 'party' ? '<path d="M20 51V14m0 3c12-8 18 8 29 0v23c-11 8-17-8-29 0"/>'
    : '<rect x="17" y="15" width="30" height="36" rx="3"/><path d="M25 23h3m8 0h3m-14 8h3m8 0h3m-14 8h3m8 0h3m-9 12v-7"/>';
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${content}</g></svg>`)}`;
}

// Explicit resolved colors: Cytoscape does not receive CSS var() expressions.
export const atlasNodeStyles: StylesheetStyle[] = [
  { selector: 'node', style: { shape: node => node.data('shape'), 'background-color': 'data(soft)', 'background-image': 'data(badge)', 'background-width': '80%', 'background-height': '80%', 'border-color': 'data(color)', 'border-width': 1.6, color: atlasTheme.ink, 'font-family': 'Arial, sans-serif', 'text-background-color': atlasTheme.paper, 'text-background-opacity': .94, 'text-background-padding': '3px', 'overlay-opacity': 0 } },
  { selector: 'node.root', style: { 'background-color': atlasTheme.forest, 'border-color': atlasTheme.forest, 'border-width': 2, 'font-weight': 'bold' } },
  { selector: 'node.active', style: { 'border-color': atlasTheme.forest, 'border-width': 3, 'underlay-color': atlasTheme.forest, 'underlay-opacity': .09, 'underlay-padding': 7, 'font-weight': 'bold' } },
  { selector: 'node.hover', style: { 'border-width': 3, 'underlay-color': atlasTheme.forest, 'underlay-opacity': .06, 'underlay-padding': 5 } },
  { selector: 'node.history-node', style: { 'border-width': 2.4, 'border-style': 'double' } },
];

export function nodeShape(entity: Entity) { return entity.type === 'person' ? 'ellipse' : entity.type === 'party' ? 'round-diamond' : 'roundrectangle'; }

export function atlasLabelStyle(label: LabelPlacement | undefined, zoom: number, bold: boolean): Record<string, string | number> {
  if (!label) return { label: '', 'text-opacity': 0 };
  return { label: label.text, 'text-opacity': 1, 'font-size': label.fontSize / zoom, 'font-weight': bold ? 'bold' : 'normal', 'text-max-width': 190 / zoom, 'text-background-padding': 3 / zoom, 'text-halign': label.side === 'left' || label.side === 'right' ? label.side : 'center', 'text-valign': label.side === 'top' || label.side === 'bottom' ? label.side : 'center', 'text-margin-x': (label.shiftX + (label.side === 'right' ? label.offset : label.side === 'left' ? -label.offset : 0)) / zoom, 'text-margin-y': (label.shiftY + (label.side === 'bottom' ? label.offset : label.side === 'top' ? -label.offset : 0)) / zoom };
}
