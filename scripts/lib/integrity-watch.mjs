import { createHash } from 'node:crypto';
import { list } from './assembly.mjs';
export const normalizeLabel = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
export function declarationDate(raw) {
  if (typeof raw !== 'string') return undefined;
  const match = raw.trim().match(/^(?:(?:(\d{2})\/)?(\d{2})\/)?(\d{4})$/);
  if (!match) return undefined;
  const [, day, month, year] = match;
  if (!Number(year) || (month && (!Number(month) || Number(month) > 12))) return undefined;
  if (day && (!Number(day) || Number(day) > new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate())) return undefined;
  return { value: `${year}-${month ?? '00'}-${day ?? '00'}`, precision: day ? 11 : month ? 10 : 9 };
}
export function integrityRelations(declaration, personId, aliases, source) {
  const relations = new Map();
  const unmatched = new Set();
  const fields = [
    ['activProfCinqDerniereDto', 'employment', 'A déclaré une activité auprès de', 'employeur', 'description'],
    ['participationDirigeantDto', 'membership', 'A déclaré siéger dans', 'nomSociete', 'activite'],
  ];
  for (const [field, category, label, organizationKey, roleKey] of fields) for (const item of list(declaration[field]?.items?.items)) {
    if (item.motif?.id === 'SUPPRESSION') continue;
    const organization = item[organizationKey]?.trim();
    if (!organization || organization.includes('[Données non publiées]')) continue;
    const target = aliases.get(normalizeLabel(organization));
    if (!target) { unmatched.add(organization); continue; }
    const role = typeof item[roleKey] === 'string' ? item[roleKey].trim() : undefined;
    const key = JSON.stringify([field, target, role, item.dateDebut, item.dateFin]);
    const id = `HATVP:${declaration.uuid}:${createHash('sha256').update(key).digest('hex').slice(0, 16)}`;
    relations.set(id, {
      id, source: personId, target, property: `HATVP:${field}`, category, label, role,
      start: declarationDate(item.dateDebut), end: declarationDate(item.dateFin),
      statementUrl: `https://www.hatvp.fr/livraison/dossiers/${source.file}.xml`,
      references: [{ id: declaration.uuid, urls: ['https://www.integritywatch.fr/', 'https://www.hatvp.fr/open-data/'], statedIn: [], importedFrom: [] }],
      evidence: { kind: 'declaration', title: 'HATVP · déclaration publique, via Integrity Watch France', locator: `${source.file} · UUID ${declaration.uuid} · ${field} · intitulé déclaré : ${organization}`, note: `Dépôt : ${declaration.dateDepot}. Publication : ${source.publishedAt}. Export Integrity Watch : ${source.snapshot}. Les dates sont celles de la déclaration ; une fin absente ne signifie pas une activité en cours.`, checkedAt: source.checkedAt },
    });
  }
  return { relations: [...relations.values()], unmatched: [...unmatched] };
}
