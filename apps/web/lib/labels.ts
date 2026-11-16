export const TYPE_LABELS: Record<string, string> = {
  HARCELEMENT_PHYSIQUE: 'Harcèlement physique',
  HARCELEMENT_VERBAL: 'Harcèlement verbal',
  CYBERHARCELEMENT: 'Cyberharcèlement',
  INTIMIDATION: 'Intimidation',
  AUTRE: 'Autre',
};

export const GRAVITY_LABELS: Record<string, string> = {
  FAIBLE: 'Faible',
  MOYENNE: 'Moyenne',
  ELEVEE: 'Élevée',
  URGENTE: 'Urgente',
};

export const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: 'Nouveau',
  EN_COURS: 'En cours de traitement',
  TRAITE: 'Traité',
  CLOS: 'Clos',
};

export const STATUS_HELP: Record<string, string> = {
  NOUVEAU: "Ton signalement a bien été reçu. Un adulte de l'établissement va le lire.",
  EN_COURS: "Un adulte de l'établissement s'occupe de ta situation.",
  TRAITE: 'Des actions ont été mises en place.',
  CLOS: 'Le dossier est clos. Tu peux faire un nouveau signalement si besoin.',
};

export const AUTHOR_LABELS: Record<string, string> = {
  ELEVE: 'Élève',
  PARENT: 'Parent',
  STAFF: 'Établissement',
};

/** Origine déclarée au dépôt (victime ou parent) */
export const ORIGIN_LABELS: Record<string, string> = {
  VICTIME: 'Victime',
  PARENT: 'Parent',
};

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
