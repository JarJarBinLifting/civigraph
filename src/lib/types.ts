export const CATEGORIES = ['education', 'office', 'party', 'employment', 'membership'] as const;
export type Category = (typeof CATEGORIES)[number];
export type EntityType = 'person' | 'school' | 'office' | 'party' | 'organization';
export interface EntityImage {
  src: string; width: number; height: number;
  author: string; attribution: string; credit: string;
  license: string; licenseUrl: string; sourcePage: string; sourceTitle: string;
  restrictions: string; takenAt: string;
}

export interface Entity {
  id: string;
  label: string;
  abbreviatedLabel?: string;
  description: string;
  type: EntityType;
  inCorpus: boolean;
  wikidataUrl?: string;
  revision?: number;
  sourceUrl?: string;
  sourceLabel?: string;
  labelSource?: { url: string; title: string; checkedAt: string };
  modified: string;
  sourceEntityId?: string;
  contexts?: StatementContext[];
  image?: EntityImage;
}

export interface StatementContext { property: string; id: string; label: string; revision: number }

export interface SourceDate { value: string; precision: number }
export interface Reference {
  id: string;
  urls: string[];
  statedIn: string[];
  importedFrom: string[];
  retrieved?: SourceDate;
}

export interface Relation {
  id: string;
  source: string;
  target: string;
  property: string;
  category: Category;
  label: string;
  start?: SourceDate;
  end?: SourceDate;
  pointInTime?: SourceDate;
  statementUrl: string;
  revisionUrl?: string;
  references: Reference[];
  contexts?: StatementContext[];
  sourceTarget?: string;
  role?: string;
  cohort?: { id: string; label: string };
  evidence?: { kind: 'official' | 'declaration'; title: string; locator: string; note: string; checkedAt: string };
}

export interface GraphData {
  meta: {
    version: number;
    fetchedAt: string;
    source: string;
    license: string;
    peopleCount: number;
    entityCount: number;
    relationCount: number;
    properties: string[];
    description: string;
    supplementedAt?: string;
  };
  entities: Entity[];
  relations: Relation[];
}

export interface ViewState {
  preset?: 'person' | 'institution' | 'comparison';
  root: string;
  focus: string;
  expanded: string[];
  categories: Category[];
  selected: string;
  compare: string | null;
  comparisonView?: 'map' | 'cards';
  comparisonMode?: 'common' | 'paths';
  mode: 'graph' | 'list';
  graphView?: 'system' | 'centered';
  system?: 'all' | Category;
  reading?: 'groups' | 'individuals';
  spotlight?: 'off';
  systemLens?: 'institutions' | 'entities' | 'common';
  group?: string[];
  commonThreshold?: 'all' | 'two';
  commonDisplay?: 'map' | 'matrix';
  institution?: string;
  bridge?: string;
  edge: string | null;
  temporal: 'all' | 'same';
  period: string | null;
  year: number | null;
}

export interface CommonConnection {
  entity: Entity;
  left: Relation[];
  right: Relation[];
}
