export const CATEGORIES = ['education', 'office', 'party', 'employment', 'membership'] as const;
export type Category = (typeof CATEGORIES)[number];
export type EntityType = 'person' | 'school' | 'office' | 'party' | 'organization';

export interface Entity {
  id: string;
  label: string;
  description: string;
  type: EntityType;
  inCorpus: boolean;
  wikidataUrl: string;
  revision: number;
  modified: string;
  sourceEntityId?: string;
  contexts?: StatementContext[];
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
  revisionUrl: string;
  references: Reference[];
  contexts?: StatementContext[];
  sourceTarget?: string;
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
  };
  entities: Entity[];
  relations: Relation[];
}

export interface ViewState {
  root: string;
  focus: string;
  expanded: string[];
  categories: Category[];
  selected: string;
  compare: string | null;
  mode: 'graph' | 'list';
  edge: string | null;
}

export interface CommonConnection {
  entity: Entity;
  left: Relation[];
  right: Relation[];
}
