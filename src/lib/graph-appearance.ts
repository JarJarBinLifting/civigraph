import type { StylesheetStyle } from 'cytoscape';
import type { EntityType } from './types';
import { typeInfo } from './presentation';
import { atlasTheme } from './graph-theme';

// Keep category hues legible without giving every entity the weight of a selection.
const outlines: Record<EntityType, string> = {
  person: '#91a4bd', school: '#83aaa1', office: '#8b9fbc',
  party: '#baaa93', organization: '#ad9cb5',
};

export function graphNodeAppearance(type: EntityType) {
  return {
    type, shape: type === 'person' ? 'ellipse' : 'roundrectangle',
    color: typeInfo[type].color, soft: typeInfo[type].soft, outline: outlines[type],
  };
}

export const graphMotion = { camera: 280, scene: 320 };

export function graphMotionEnabled() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Detailed views use their existing symbols, tinted like their outlines at rest.
export const quietNodeStyles: StylesheetStyle[] = [
  { selector: 'node', style: { 'background-color': 'data(soft)', 'border-color': 'data(outline)', 'background-image': 'data(quietBadge)', 'underlay-shape': node => node.data('type') === 'person' ? 'ellipse' : 'round-rectangle' } },
  { selector: 'node.root, node.active, node.hover, node.inspected-neighbor, node.edge-endpoint', style: { 'background-color': 'data(color)', 'border-color': 'data(color)', 'background-image': 'data(badge)' } },
  { selector: 'node.root, node.active, node.hover', style: { 'border-color': atlasTheme.brand, 'underlay-color': atlasTheme.brand, 'underlay-opacity': .08 } },
];
