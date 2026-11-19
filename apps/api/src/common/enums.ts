export const REPORT_TYPES = [
  'HARCELEMENT_PHYSIQUE',
  'HARCELEMENT_VERBAL',
  'CYBERHARCELEMENT',
  'INTIMIDATION',
  'AUTRE',
] as const;
export const GRAVITIES = ['FAIBLE', 'MOYENNE', 'ELEVEE', 'URGENTE'] as const;
export const STATUSES = ['NOUVEAU', 'EN_COURS', 'TRAITE', 'CLOS'] as const;
export const AUTHOR_ORIGINS = ['VICTIME', 'PARENT', 'TEMOIN'] as const;

export type ReportTypeT = (typeof REPORT_TYPES)[number];
export type GravityT = (typeof GRAVITIES)[number];
export type StatusT = (typeof STATUSES)[number];
export type AuthorOriginT = (typeof AUTHOR_ORIGINS)[number];
