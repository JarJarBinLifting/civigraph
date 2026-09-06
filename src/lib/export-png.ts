import type { Core } from 'cytoscape';
import type { GraphExportInfo } from './graph-export';

function imageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob), image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('La carte ne peut pas être convertie en image.')); };
    image.src = url;
  });
}

function guideSnapshot(svg: SVGSVGElement, width: number, height: number) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width)); clone.setAttribute('height', String(height));
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const originals = svg.querySelectorAll('*');
  clone.querySelectorAll('*').forEach((element, index) => {
    const style = getComputedStyle(originals[index]);
    // Preserve the paper outline behind the glyphs, not over their fill.
    for (const key of ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linejoin', 'paint-order', 'vector-effect', 'font-family', 'font-size']) element.setAttribute(key, style.getPropertyValue(key));
  });
  return new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
}

function lines(context: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (context.measureText(`${line} ${word}`.trim()).width <= width) { line = `${line} ${word}`.trim(); continue; }
    if (line) result.push(line);
    line = '';
    for (const char of word) {
      if (line && context.measureText(line + char).width > width) { result.push(line); line = ''; }
      line += char;
    }
  }
  if (line) result.push(line);
  return result;
}

export async function exportGraphPng(instance: Core, svg: SVGSVGElement, info: GraphExportInfo) {
  if (instance.animated() || instance.nodes(':animated').length) throw new Error('Attendez la fin du déplacement de la carte, puis relancez l’export.');
  if (instance.nodes(':backgrounding').length) throw new Error('Certaines images chargent encore. Relancez l’export dans un instant.');
  const width = instance.width(), height = instance.height();
  if (!width || !height) throw new Error('Ouvrez la carte avant de l’exporter.');
  const chartWidth = Math.round(Math.min(1800, Math.max(1200, width * 1.5)));
  const chartHeight = Math.round(chartWidth * height / width);
  // Capture both layers synchronously before any asynchronous conversion or later user navigation.
  const graphBlob = instance.png({ output: 'blob', full: false, maxWidth: chartWidth, maxHeight: chartHeight });
  const guideBlob = guideSnapshot(svg, width, height);
  const [graph, guides] = await Promise.all([imageFromBlob(graphBlob), imageFromBlob(guideBlob)]);
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('L’export PNG n’est pas disponible dans ce navigateur.');
  const margin = 48, outputWidth = chartWidth + margin * 2;
  type TextBlock = { lines: string[]; y: number; font: string; color: string; lineHeight: number };
  const blocks: TextBlock[] = [];
  let y = margin;
  function block(text: string, font = '18px Arial, sans-serif', lineHeight = 27, color = '#384a40', space = 8) {
    context!.font = font;
    const wrapped = lines(context!, text, chartWidth);
    blocks.push({ lines: wrapped, y, font, color, lineHeight });
    y += wrapped.length * lineHeight + space;
  }
  block('CIVIGRAPH  /  ATLAS DES LIENS DOCUMENTÉS', 'bold 17px Arial, sans-serif', 26, '#254d40', 14);
  block(info.title, '36px Georgia, serif', 44, '#203c31', 20);
  for (const item of info.context) block(item);
  y += 14;
  const chartTop = y;
  y += chartHeight + 30;
  block('Lire la carte', 'bold 20px Arial, sans-serif', 30);
  for (const category of info.legend) block(`●  ${category.label}`, '18px Arial, sans-serif', 26, category.color, 2);
  y += 10;
  for (const note of info.notes) block(note, '17px Arial, sans-serif', 25, '#526454', 8);
  block(`Référence de la vue : ${window.location.origin}${window.location.pathname}${info.query}`, '14px Arial, sans-serif', 22, '#254d40', 12);
  if (info.credits.length) {
    block('Crédits des images', 'bold 17px Arial, sans-serif', 26);
    for (const credit of info.credits) block(credit, '14px Arial, sans-serif', 21, '#526454', 8);
  }
  if (y + margin > 16000) throw new Error('Cette vue contient trop de texte pour un PNG lisible. Conservez son lien avec « Partager la vue ».');
  canvas.width = outputWidth; canvas.height = Math.ceil(y + margin);
  context.fillStyle = '#f8faf5'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#fafbf8'; context.fillRect(margin, chartTop, chartWidth, chartHeight);
  context.drawImage(guides, margin, chartTop, chartWidth, chartHeight);
  context.drawImage(graph, margin, chartTop, chartWidth, chartHeight);
  context.strokeStyle = '#d8e1d1'; context.strokeRect(margin, chartTop, chartWidth, chartHeight);
  context.textBaseline = 'top';
  for (const block of blocks) {
    context.font = block.font; context.fillStyle = block.color;
    block.lines.forEach((line, index) => context.fillText(line, margin, block.y + index * block.lineHeight));
  }
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Le fichier PNG n’a pas pu être créé.')), 'image/png'));
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = info.filename; document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
