/**
 * Système de gestion centralisée des médias - L'Auberge Boischatel
 *
 * Convention de codes:
 * - H = Hero (Accueil)
 * - M = Mission
 * - A = À Propos
 * - S = Sécurité
 * - C = Chambres
 * - AC = Activités
 * - V = Visite 3D
 * - R = Repas
 * - SV = Services
 * - CT = Contact
 * - F = Footer
 * - G = Galerie
 * - EXT = Extérieurs
 */

// Types pour les codes médias
export type MediaCode =
  // Hero
  | 'H1'
  // Mission
  | 'M1'
  // À Propos
  | 'A1' | 'A2' | 'A3'
  // Sécurité
  | 'S1' | 'S2' | 'S3' | 'S4'
  // Chambres
  | 'C1' | 'C2' | 'C3'
  // Activités
  | 'AC1' | 'AC2' | 'AC3' | 'AC4' | 'AC5' | 'AC6'
  // Visite 3D
  | 'V1' | 'V2'
  // Repas
  | 'R1' | 'R2' | 'R3'
  // Services
  | 'SV1' | 'SV2' | 'SV3'
  // Contact
  | 'CT1'
  // Footer
  | 'F1'
  // Galerie (extensible)
  | 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'G7' | 'G8' | 'G9' | 'G10'
  | 'G11' | 'G12' | 'G13' | 'G14' | 'G15' | 'G16' | 'G17' | 'G18' | 'G19' | 'G20'
  // Extérieurs
  | 'EXT1' | 'EXT2' | 'EXT3' | 'EXT4' | 'EXT5';

export interface MediaItem {
  path: string;
  alt: string;
  type: 'image' | 'model' | 'video';
  width?: number;
  height?: number;
  placeholder?: string; // Pour lazy loading
}

/**
 * Mapping central de tous les médias du site
 * Utiliser ce fichier comme source unique de vérité
 */
export const mediaMap: Record<MediaCode, MediaItem> = {
  // ═══════════════════════════════════════════════════════════════
  // HERO (Accueil)
  // ═══════════════════════════════════════════════════════════════
  H1: {
    path: '/static/images/facade-golden-hour.jpg',
    alt: "Façade de L'Auberge Boischatel au coucher du soleil",
    type: 'image',
    placeholder: '/static/images/facade-golden-hour.jpg' // Version basse résolution si disponible
  },

  // ═══════════════════════════════════════════════════════════════
  // MISSION
  // ═══════════════════════════════════════════════════════════════
  M1: {
    path: '/static/models/logo-3d.glb',
    alt: "Logo 3D interactif L'Auberge Boischatel",
    type: 'model'
  },

  // ═══════════════════════════════════════════════════════════════
  // À PROPOS
  // ═══════════════════════════════════════════════════════════════
  A1: {
    path: '/static/images/equipe-designer.jpg',
    alt: "Équipe dynamique de L'Auberge Boischatel",
    type: 'image'
  },
  A2: {
    path: '', // À compléter
    alt: "Photo équipe 2",
    type: 'image'
  },
  A3: {
    path: '', // À compléter
    alt: "Photo équipe 3",
    type: 'image'
  },

  // ═══════════════════════════════════════════════════════════════
  // SÉCURITÉ (icônes actuellement, photos optionnelles)
  // ═══════════════════════════════════════════════════════════════
  S1: {
    path: '', // Icône FontAwesome utilisée
    alt: "Certification RPA Québec",
    type: 'image'
  },
  S2: {
    path: '',
    alt: "Système incendie",
    type: 'image'
  },
  S3: {
    path: '',
    alt: "Surveillance 24/7",
    type: 'image'
  },
  S4: {
    path: '',
    alt: "Personnel qualifié",
    type: 'image'
  },

  // ═══════════════════════════════════════════════════════════════
  // CHAMBRES
  // ═══════════════════════════════════════════════════════════════
  C1: {
    path: '/static/images/chambre.png',
    alt: "Chambre standard - L'Auberge Boischatel",
    type: 'image'
  },
  C2: {
    path: '/static/images/chambre-superieure.jpg',
    alt: "Chambre supérieure moderne - L'Auberge Boischatel",
    type: 'image'
  },
  C3: {
    path: '/static/images/suite.png',
    alt: "Suite confortable - L'Auberge Boischatel",
    type: 'image'
  },

  // ═══════════════════════════════════════════════════════════════
  // ACTIVITÉS (icônes actuellement)
  // ═══════════════════════════════════════════════════════════════
  AC1: {
    path: '',
    alt: "Activités physiques",
    type: 'image'
  },
  AC2: {
    path: '',
    alt: "Activités culturelles",
    type: 'image'
  },
  AC3: {
    path: '',
    alt: "Activités sociales",
    type: 'image'
  },
  AC4: {
    path: '',
    alt: "Jardinage",
    type: 'image'
  },
  AC5: {
    path: '',
    alt: "Musique et arts",
    type: 'image'
  },
  AC6: {
    path: '',
    alt: "Sorties et excursions",
    type: 'image'
  },

  // ═══════════════════════════════════════════════════════════════
  // VISITE 3D
  // ═══════════════════════════════════════════════════════════════
  V1: {
    path: '/static/models/auberge-3d.glb',
    alt: "Visite virtuelle 3D de L'Auberge Boischatel",
    type: 'model'
  },
  V2: {
    path: '', // Version USDZ pour iOS si disponible
    alt: "Visite 3D format iOS",
    type: 'model'
  },

  // ═══════════════════════════════════════════════════════════════
  // REPAS
  // ═══════════════════════════════════════════════════════════════
  R1: {
    path: '/static/images/salle-manger.png',
    alt: "Salle à manger - L'Auberge Boischatel",
    type: 'image'
  },
  R2: {
    path: '', // À compléter - Menu ou chef
    alt: "Menu gastronomique",
    type: 'image'
  },
  R3: {
    path: '', // À compléter
    alt: "Cuisine et préparation",
    type: 'image'
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVICES (icônes actuellement)
  // ═══════════════════════════════════════════════════════════════
  SV1: {
    path: '',
    alt: "Services de soins",
    type: 'image'
  },
  SV2: {
    path: '',
    alt: "Services quotidiens",
    type: 'image'
  },
  SV3: {
    path: '',
    alt: "Services de loisirs",
    type: 'image'
  },

  // ═══════════════════════════════════════════════════════════════
  // CONTACT
  // ═══════════════════════════════════════════════════════════════
  CT1: {
    path: '', // Google Maps embed
    alt: "Localisation L'Auberge Boischatel",
    type: 'image'
  },

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  F1: {
    path: '/static/images/logo.png',
    alt: "Logo L'Auberge Boischatel",
    type: 'image'
  },

  // ═══════════════════════════════════════════════════════════════
  // GALERIE (G1-G20)
  // ═══════════════════════════════════════════════════════════════
  G1: { path: '/static/images/facade.jpg', alt: 'Façade principale', type: 'image' },
  G2: { path: '/static/images/jardin.jpg', alt: 'Jardin', type: 'image' },
  G3: { path: '/static/images/vue-nocturne.jpg', alt: 'Vue nocturne', type: 'image' },
  G4: { path: '/static/images/galerie.jpg', alt: 'Galerie', type: 'image' },
  G5: { path: '/static/images/galerie-entree.jpg', alt: 'Entrée principale avec auvent', type: 'image' },
  G6: { path: '/static/images/galerie-terrasse-5424.jpg', alt: 'Terrasse couverte - 5424 avenue Royale', type: 'image' },
  G7: { path: '', alt: 'Photo galerie 7', type: 'image' },
  G8: { path: '', alt: 'Photo galerie 8', type: 'image' },
  G9: { path: '', alt: 'Photo galerie 9', type: 'image' },
  G10: { path: '', alt: 'Photo galerie 10', type: 'image' },
  G11: { path: '', alt: 'Photo galerie 11', type: 'image' },
  G12: { path: '', alt: 'Photo galerie 12', type: 'image' },
  G13: { path: '', alt: 'Photo galerie 13', type: 'image' },
  G14: { path: '', alt: 'Photo galerie 14', type: 'image' },
  G15: { path: '', alt: 'Photo galerie 15', type: 'image' },
  G16: { path: '', alt: 'Photo galerie 16', type: 'image' },
  G17: { path: '', alt: 'Photo galerie 17', type: 'image' },
  G18: { path: '', alt: 'Photo galerie 18', type: 'image' },
  G19: { path: '', alt: 'Photo galerie 19', type: 'image' },
  G20: { path: '', alt: 'Photo galerie 20', type: 'image' },

  // ═══════════════════════════════════════════════════════════════
  // EXTÉRIEURS (EXT1-EXT5)
  // ═══════════════════════════════════════════════════════════════
  EXT1: { path: '/static/images/facade-golden-hour-4k.jpg', alt: 'Façade haute résolution', type: 'image' },
  EXT2: { path: '/static/images/jardin.jpg', alt: 'Jardins', type: 'image' },
  EXT3: { path: '/static/images/exterieur-balcon.jpg', alt: 'Vue arrière avec balcon', type: 'image' },
  EXT4: { path: '/static/images/exterieur-veranda.jpg', alt: 'Véranda vitrée extérieure', type: 'image' },
  EXT5: { path: '/static/images/vue-aerienne-boischatel.jpg', alt: 'Vue aérienne de Boischatel en automne', type: 'image' },
};

// ═══════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════

/**
 * Récupère le chemin d'un média par son code
 */
export function getMediaPath(code: MediaCode): string {
  return mediaMap[code]?.path || '';
}

/**
 * Récupère l'objet média complet par son code
 */
export function getMedia(code: MediaCode): MediaItem | undefined {
  return mediaMap[code];
}

/**
 * Vérifie si un média existe (path non vide)
 */
export function hasMedia(code: MediaCode): boolean {
  return Boolean(mediaMap[code]?.path);
}

/**
 * Récupère tous les médias d'une catégorie
 * @param prefix - Préfixe de code (ex: 'G' pour galerie, 'C' pour chambres)
 */
export function getMediasByCategory(prefix: string): MediaItem[] {
  return Object.entries(mediaMap)
    .filter(([code]) => code.startsWith(prefix))
    .map(([, item]) => item)
    .filter(item => item.path !== '');
}

/**
 * Récupère les codes avec médias manquants
 */
export function getMissingMedia(): MediaCode[] {
  return Object.entries(mediaMap)
    .filter(([, item]) => item.path === '')
    .map(([code]) => code as MediaCode);
}

/**
 * Liste des médias actuellement disponibles
 */
export function getAvailableMedia(): { code: MediaCode; item: MediaItem }[] {
  return Object.entries(mediaMap)
    .filter(([, item]) => item.path !== '')
    .map(([code, item]) => ({ code: code as MediaCode, item }));
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES POUR RÉFÉRENCE RAPIDE
// ═══════════════════════════════════════════════════════════════

export const MEDIA_CODES = {
  // Sections principales
  HERO: ['H1'] as const,
  MISSION: ['M1'] as const,
  APROPOS: ['A1', 'A2', 'A3'] as const,
  SECURITE: ['S1', 'S2', 'S3', 'S4'] as const,
  CHAMBRES: ['C1', 'C2', 'C3'] as const,
  ACTIVITES: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6'] as const,
  VISITE3D: ['V1', 'V2'] as const,
  REPAS: ['R1', 'R2', 'R3'] as const,
  SERVICES: ['SV1', 'SV2', 'SV3'] as const,
  CONTACT: ['CT1'] as const,
  FOOTER: ['F1'] as const,
  GALERIE: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10',
            'G11', 'G12', 'G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20'] as const,
  EXTERIEURS: ['EXT1', 'EXT2', 'EXT3', 'EXT4', 'EXT5'] as const,
};
