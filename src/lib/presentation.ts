import { type Category, type Entity, type EntityType, type Relation, type SourceDate } from './types';

export const categoryInfo: Record<Category, { label: string; singular: string; color: string; soft: string }> = {
  education: { label: 'Formations', singular: 'Formation', color: '#658774', soft: '#edf3ed' },
  office: { label: 'Fonctions publiques', singular: 'Fonction', color: '#637e9c', soft: '#eef2f8' },
  party: { label: 'Partis & statuts', singular: 'Affiliation politique', color: '#b28b5c', soft: '#f9f1e5' },
  employment: { label: 'Parcours professionnel', singular: 'Employeur', color: '#96789d', soft: '#f4eef6' },
  membership: { label: 'Organisations', singular: 'Organisation', color: '#7d8e93', soft: '#eef2f2' },
};
export const typeInfo: Record<EntityType, { label: string; color: string; soft: string }> = {
  person: { label: 'Personnalité', color: '#254d40', soft: '#e6eee9' },
  school: { label: 'Établissement', color: '#658774', soft: '#edf3ed' },
  office: { label: 'Fonction', color: '#637e9c', soft: '#eef2f8' },
  party: { label: 'Parti / statut', color: '#b28b5c', soft: '#f9f1e5' },
  organization: { label: 'Organisation', color: '#96789d', soft: '#f4eef6' },
};

const displayAliases: Record<string, string> = {
  Q273579: 'ENA', Q859363: 'Sciences Po Paris', Q1394262: 'Université Paris-Nanterre',
  Q191954: 'Président de la République', Q1587677: 'Premier ministre',
  Q2986712: 'Commission Attali', Q17618189: 'Secrétariat général adjoint de l’Élysée',
  Q17618126: 'Ministre de l’Économie', Q19808845: 'Co-prince d’Andorre',
};

export function shortLabel(entity: Entity): string {
  return displayAliases[entity.id] ?? entity.label.charAt(0).toUpperCase() + entity.label.slice(1);
}
export function initials(label: string): string {
  const words = label.replace(/·.*$/, '').split(/[\s-]+/).filter(Boolean);
  return `${words[0]?.[0] ?? ''}${words.length > 1 ? words[words.length - 1][0] : ''}`.toUpperCase();
}
export function formatDate(date?: SourceDate): string {
  if (!date) return 'Non renseignée';
  const [year, month, day] = date.value.split('-').map(Number);
  if (date.precision < 9) return `Vers ${year}`;
  if (date.precision === 9 || !month) return String(year);
  const value = new Date(Date.UTC(year, month - 1, Math.max(day || 1, 1)));
  return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'short', ...(date.precision >= 11 && day ? { day: 'numeric' as const } : {}), timeZone: 'UTC' }).format(value);
}
export function periodLabel(relation: Relation): string {
  if (relation.start && relation.end) return `${formatDate(relation.start)} – ${formatDate(relation.end)}`;
  if (relation.start) return `Début : ${formatDate(relation.start)} · fin non renseignée`;
  if (relation.end) return `Fin : ${formatDate(relation.end)} · début non renseigné`;
  if (relation.pointInTime) return `${relation.evidence ? (relation.pointInTime.precision >= 11 ? 'Attesté le' : 'Attesté en') : 'En'} ${formatDate(relation.pointInTime)}`;
  return 'Période non renseignée';
}
export function hasExternalReference(relation: Relation): boolean {
  return relation.references.some(reference => reference.urls.length > 0);
}
