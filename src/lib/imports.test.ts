import { describe, expect, it } from 'vitest';
import { assemblyRelation } from '../../scripts/lib/assembly.mjs';
import { declarationDate, integrityRelations } from '../../scripts/lib/integrity-watch.mjs';

const mandate = { uid: 'PM657164', acteurRef: 'PA345619', legislature: '14', typeOrgane: 'COMPER', dateDebut: '2012-06-28', dateFin: '2013-09-30', infosQualite: { libQualite: 'Membre' }, organes: { organeRef: 'PO419865' } };

describe('conversion of official parliamentary mandates', () => {
  it('preserves the exact mandate, organ, dates and primary evidence', () => {
    const relation = assemblyRelation(mandate, 'Q3579995', 'PO419865', '2026-09-06');
    expect(relation?.source).toBe('Q3579995');
    expect(relation?.target).toBe('AN:PO419865');
    expect(relation?.start).toEqual({ value: '2012-06-28', precision: 11 });
    expect(relation?.end).toEqual({ value: '2013-09-30', precision: 11 });
    expect(relation?.evidence.locator).toContain('PM657164');
    expect(relation?.category).toBe('membership');
  });
  it('uses the personal taking-office date for a replacement, not the legislature start', () => {
    const relation = assemblyRelation({ ...mandate, uid: 'PM545051', typeOrgane: 'ASSEMBLEE', dateDebut: '2007-06-20', dateFin: '2012-06-19', mandature: { datePriseFonction: '2012-03-23' } }, 'Q3579995', 'PO384266', '2026-09-06');
    expect(relation?.start?.value).toBe('2012-03-23');
    expect(relation?.category).toBe('office');
  });
  it('leaves an absent end unknown and does not import party-funding attachments as membership', () => {
    expect(assemblyRelation({ ...mandate, dateFin: null }, 'Q3579995', 'PO419865', '2026-09-06')?.end).toBeUndefined();
    expect(assemblyRelation({ ...mandate, typeOrgane: 'PARPOL' }, 'Q3579995', 'PO419865', '2026-09-06')).toBeNull();
    expect(assemblyRelation({ ...mandate, typeOrgane: 'GP' }, 'Q3579995', 'PO419865', '2026-09-06')?.label).toBe('A siégé dans le groupe');
  });
});

describe('HATVP declarations distributed by Integrity Watch', () => {
  it('preserves month precision and refuses invented or invalid dates', () => {
    expect(declarationDate('07/2023')).toEqual({ value: '2023-07-00', precision: 10 });
    expect(declarationDate('2023')).toEqual({ value: '2023-00-00', precision: 9 });
    expect(declarationDate('')).toBeUndefined();
    expect(declarationDate('13/2023')).toBeUndefined();
    expect(declarationDate('31/02/2023')).toBeUndefined();
  });
  it('imports only mapped professional organizations and preserves the original declaration identity', () => {
    const declaration = { uuid: 'public-declaration', dateDepot: '24/01/2025 14:41:51', activProfCinqDerniereDto: { items: { items: [{ employeur: 'HEC Paris', description: 'Enseignement', dateDebut: '09/2020', dateFin: null }, { employeur: 'État', description: 'Fonction' }] } }, activProfConjointDto: { items: { items: [{ employeur: 'HEC Paris' }] } } };
    const source = { file: 'example-dia1-depute-01', checkedAt: '2026-09-06', snapshot: '20260905_210004', publishedAt: '2025-02-25' };
    const aliases = new Map([['hec paris', 'Q273535']]);
    const result = integrityRelations(declaration, 'Qperson', aliases, source);
    expect(result.relations).toHaveLength(1);
    expect(result.relations[0].target).toBe('Q273535');
    expect(result.relations[0].category).toBe('employment');
    expect(result.relations[0].end).toBeUndefined();
    expect(result.relations[0].evidence.locator).toContain('public-declaration');
    expect(result.relations[0].statementUrl).toBe('https://www.hatvp.fr/livraison/dossiers/example-dia1-depute-01.xml');
    expect(result.relations[0].id).toBe(integrityRelations(declaration, 'Qperson', aliases, source).relations[0].id);
    expect(result.unmatched).toEqual(['État']);
  });
});
