/**
 * Configuration Business - L'Auberge Boischatel
 * Informations officielles de l'entreprise
 */

export const business = {
  // ═══════════════════════════════════════════════════════════════
  // ENTITÉ LÉGALE
  // ═══════════════════════════════════════════════════════════════
  legal: {
    name: "9335-2078 Québec inc.",
    neq: "1179372579",
    acquisitionDate: "2016-06-01",
    type: "Résidence privée pour aînés à but lucratif",
    category: 3,
  },

  // ═══════════════════════════════════════════════════════════════
  // COORDONNÉES
  // ═══════════════════════════════════════════════════════════════
  contact: {
    address: {
      street: "5424, avenue Royale",
      city: "Boischatel",
      province: "QC",
      postalCode: "G0A 1H0",
      full: "5424, avenue Royale, Boischatel, QC G0A 1H0",
    },
    phone: "418-822-0347",
    email: "contact@aubergeboischatel.com",
    website: "www.auberge-boischatel.ca",
  },

  // ═══════════════════════════════════════════════════════════════
  // CONSEIL D'ADMINISTRATION
  // ═══════════════════════════════════════════════════════════════
  board: [
    {
      name: "Mathieu Bouchard",
      role: "Président",
      title: "president",
    },
    {
      name: "Mathieu Chamberland",
      role: "Secrétaire-trésorier",
      title: "secretary-treasurer",
    },
    {
      name: "André-Pierre Savard",
      role: "Vice-Président",
      title: "vice-president",
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // DIRECTION OPÉRATIONNELLE
  // ═══════════════════════════════════════════════════════════════
  management: {
    director: {
      name: "Noémie Gamache",
      role: "Responsable de la résidence",
      email: "n.gamache@aubergeboischatel.com",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CARACTÉRISTIQUES DE LA RÉSIDENCE
  // ═══════════════════════════════════════════════════════════════
  residence: {
    openingYear: 1987,
    totalUnits: 38,
    unitType: "Chambres simples",
    currentResidents: 36,
    region: "Capitale-Nationale",
    clsc: "Orléans",
    rls: "Québec-Nord",
    certification: "RPA Québec",
  },

  // ═══════════════════════════════════════════════════════════════
  // DÉMOGRAPHIE DES RÉSIDENTS
  // ═══════════════════════════════════════════════════════════════
  demographics: {
    ageGroups: [
      { range: "Moins de 65 ans", count: 2 },
      { range: "65-74 ans", count: 12 },
      { range: "75-84 ans", count: 12 },
      { range: "85 ans et plus", count: 10 },
    ],
    total: 36,
  },

  // ═══════════════════════════════════════════════════════════════
  // STATISTIQUES POUR AFFICHAGE
  // ═══════════════════════════════════════════════════════════════
  stats: {
    units: 38,
    employees: 15, // Approximatif - à confirmer
    yearsOfService: new Date().getFullYear() - 1987,
    certification: "100% RPA",
    assistance: "24/7",
  },
} as const;

// Types exportés
export type BoardMember = typeof business.board[number];
export type AgeGroup = typeof business.demographics.ageGroups[number];

// Fonctions utilitaires
export function getFullAddress(): string {
  return business.contact.address.full;
}

export function getYearsInOperation(): number {
  return new Date().getFullYear() - business.residence.openingYear;
}

export function getOccupancyRate(): number {
  return Math.round((business.residence.currentResidents / business.residence.totalUnits) * 100);
}
