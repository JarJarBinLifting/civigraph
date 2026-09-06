export const ASSEMBLY_SOURCE = 'https://data.assemblee-nationale.fr/acteurs/historique-des-deputes';
export const ASSEMBLY_ARCHIVE = 'https://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip';
const types = new Set(['ASSEMBLEE', 'COMPER', 'COMNL', 'CNPS', 'MISINFO', 'MISINFOPRE', 'DELEG', 'OFFPAR', 'GP']);
export const list = value => value == null ? [] : Array.isArray(value) ? value : [value];
export const textId = value => typeof value === 'string' ? value : value?.['#text'];
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? { value, precision: 11 } : undefined;

export function assemblyRelation(mandate, personId, organId, checkedAt) {
  if (!types.has(mandate.typeOrgane)) return null;
  const category = mandate.typeOrgane === 'ASSEMBLEE' ? 'office' : mandate.typeOrgane === 'GP' ? 'party' : 'membership';
  // For replacements, dateDebut can be the legislature's start, years before this person took office.
  const start = date(mandate.mandature?.datePriseFonction) ?? date(mandate.dateDebut);
  const end = date(mandate.dateFin);
  if (start && end && start.value > end.value) throw new Error(`Dates inversées : ${mandate.uid}`);
  return {
    id: `AN:${mandate.uid}:${organId}`, source: personId, target: `AN:${organId}`,
    property: 'AN:mandat', category,
    label: category === 'party' ? 'A siégé dans le groupe' : 'A siégé à',
    role: mandate.infosQualite?.libQualite || 'Membre', start, end,
    statementUrl: ASSEMBLY_SOURCE,
    references: [{ id: mandate.uid, urls: [ASSEMBLY_ARCHIVE], statedIn: [], importedFrom: [] }],
    evidence: { kind: 'official', title: 'Assemblée nationale — historique des mandats', locator: `json/acteur/${mandate.acteurRef}.json · mandat ${mandate.uid} · organe ${organId}`, note: `Mandat individuel${mandate.legislature ? ` · législature ${mandate.legislature}` : ''}. Une date de fin absente reste inconnue.`, checkedAt },
  };
}

export function assemblyEntity(organ, checkedAt) {
  return { id: `AN:${organ.uid}`, label: organ.libelle, abbreviatedLabel: organ.libelleAbrege || undefined, description: `Organe de l’Assemblée nationale${organ.legislature ? ` · législature ${organ.legislature}` : ''} · ${organ.uid}`, type: organ.codeType === 'GP' ? 'party' : 'organization', inCorpus: false, modified: checkedAt, sourceUrl: ASSEMBLY_SOURCE, sourceLabel: 'Assemblée nationale' };
}
