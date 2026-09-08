import type { NodeSingular } from 'cytoscape';
import { graphFont, systemPalette, systemPaper } from './graph-theme';

function point(node: NodeSingular) {
  return { id: node.id(), ...node.renderedPosition(), radius: Math.max(3, node.renderedWidth() / 2), person: node.data('kind') === 'person', color: String(node.data('outline') || systemPalette.person) };
}

/** Read only the hovered node's neighborhood; never mutate Cytoscape styles. */
export function systemHoverScene(node: NodeSingular) {
  const center = point(node), neighbors = new Map<string, ReturnType<typeof point>>();
  const links: { from: ReturnType<typeof point>; to: ReturnType<typeof point> }[] = [];
  node.connectedEdges().forEach(edge => {
    if (!edge.visible()) return;
    const other = edge.source().id() === node.id() ? edge.target() : edge.source();
    if (!other.visible()) return;
    const neighbor = point(other); neighbors.set(other.id(), neighbor);
    links.push({ from: center, to: neighbor });
  });
  return { center, neighbors: [...neighbors.values()], links, label: String(node.data('label') || node.id()) };
}

/** A separate transparent canvas keeps hover feedback out of the large renderer. */
export function createSystemHoverOverlay(host: HTMLElement) {
  const canvas = document.createElement('canvas');
  canvas.className = 'system-hover-overlay'; canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none;';
  canvas.hidden = true; host.append(canvas);
  const context = canvas.getContext('2d');
  let hovered: string | null = null;
  const clear = () => { hovered = null; canvas.hidden = true; delete host.dataset.hovered; host.style.cursor = ''; };
  return {
    clear,
    destroy: () => { clear(); canvas.remove(); },
    show(node: NodeSingular) {
      if (!context || hovered === node.id()) return;
      hovered = node.id();
      const width = host.clientWidth, height = host.clientHeight, ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height);
      const scene = systemHoverScene(node);
      context.fillStyle = 'rgba(248,247,243,.72)'; context.fillRect(0, 0, width, height);
      context.strokeStyle = scene.center.color; context.lineWidth = 1.5;
      context.beginPath();
      for (const link of scene.links) { context.moveTo(link.from.x, link.from.y); context.lineTo(link.to.x, link.to.y); }
      context.stroke();
      for (const p of [...scene.neighbors, scene.center]) {
        context.beginPath(); context.fillStyle = p.person ? p.color : '#fff'; context.strokeStyle = p.color;
        if (p.person) context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        else context.roundRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2, 2);
        context.fill(); context.stroke();
      }
      const p = scene.center;
      context.beginPath(); context.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2); context.lineWidth = 2; context.strokeStyle = p.color; context.stroke();
      context.font = `600 14px ${graphFont}`;
      const maxWidth = Math.min(290, width - 36), lines: string[] = [];
      let line = '';
      for (const word of scene.label.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (line && context.measureText(next).width > maxWidth) { lines.push(line); line = word; } else line = next;
      }
      if (line) lines.push(line);
      const labelWidth = Math.min(maxWidth, Math.max(...lines.map(text => context.measureText(text).width))) + 24;
      const labelHeight = lines.length * 19 + 20;
      const x = Math.max(6, Math.min(width - labelWidth - 6, p.x - labelWidth / 2));
      const y = Math.max(6, p.y + p.radius + 14 + labelHeight < height ? p.y + p.radius + 14 : p.y - p.radius - labelHeight - 14);
      context.fillStyle = systemPaper; context.lineWidth = 1.5; context.beginPath(); context.roundRect(x, y, labelWidth, labelHeight, 6); context.fill(); context.stroke();
      context.fillStyle = systemPalette.person; context.textAlign = 'center'; context.textBaseline = 'top';
      lines.forEach((text, i) => context.fillText(text, x + labelWidth / 2, y + 10 + i * 19, maxWidth));
      canvas.hidden = false; host.dataset.hovered = node.id(); host.style.cursor = 'pointer';
    },
  };
}
