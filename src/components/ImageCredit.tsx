import type { EntityImage } from '@/lib/types';
export function ImageCredit({ image }: { image: EntityImage }) {
  return <details className="image-credit"><summary>Crédit de l’image</summary>
    <p>{image.author}{image.attribution && image.attribution !== image.author ? ` · ${image.attribution}` : ''}</p>
    <p><a href={image.licenseUrl} target="_blank" rel="noopener noreferrer">{image.license}</a> · <a href={image.sourcePage} target="_blank" rel="noopener noreferrer">Notice Wikimedia Commons ↗</a></p>
    <p>{image.sourceTitle.replace(/^File:/, '')}</p>
    {image.credit && <p>Origine : {image.credit === 'Own work' ? 'travail personnel de l’auteur' : image.credit}</p>}
    {image.takenAt && <p>Date indiquée par la source : {image.takenAt}</p>}
    <p>Vignette redimensionnée, parfois recadrée à l’affichage. L’image et son recadrage gardent la licence indiquée.</p>
    {image.restrictions && <p>Indication complémentaire de Commons : {image.restrictions}</p>}
  </details>;
}
