/**
 * Composant MediaByCode - Affiche un média par son code standardisé
 * Utilise le système de mapping centralisé dans src/config/media.ts
 */

import { mediaMap, MediaCode, MediaItem } from '../config/media';

interface MediaByCodeProps {
  code: MediaCode;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  // Pour les images
  width?: number | string;
  height?: number | string;
  // Pour les modèles 3D
  autoRotate?: boolean;
  interactive?: boolean;
  // Fallback si média non trouvé
  fallback?: React.ReactNode;
  // Alt text override
  alt?: string;
}

/**
 * Génère le HTML pour afficher un média selon son code
 * Compatible avec le rendu SSR de Hono
 */
export function getMediaHTML(
  code: MediaCode,
  options: {
    className?: string;
    style?: string;
    width?: number | string;
    height?: number | string;
    loading?: 'lazy' | 'eager';
    alt?: string;
  } = {}
): string {
  const media = mediaMap[code];

  if (!media || !media.path) {
    return `<!-- Media ${code} non disponible -->`;
  }

  const {
    className = '',
    style = '',
    width,
    height,
    loading = 'lazy',
    alt
  } = options;

  const altText = alt || media.alt;
  const widthAttr = width ? `width="${width}"` : '';
  const heightAttr = height ? `height="${height}"` : '';
  const classAttr = className ? `class="${className}"` : '';
  const styleAttr = style ? `style="${style}"` : '';

  if (media.type === 'image') {
    return `<img
      src="${media.path}"
      alt="${altText}"
      ${classAttr}
      ${styleAttr}
      ${widthAttr}
      ${heightAttr}
      loading="${loading}"
      data-media-code="${code}"
    />`.replace(/\s+/g, ' ').trim();
  }

  if (media.type === 'video') {
    return `<video
      src="${media.path}"
      ${classAttr}
      ${styleAttr}
      ${widthAttr}
      ${heightAttr}
      data-media-code="${code}"
      controls
    ></video>`.replace(/\s+/g, ' ').trim();
  }

  // Pour les modèles 3D, retourne un conteneur
  if (media.type === 'model') {
    return `<div
      id="model-${code.toLowerCase()}"
      ${classAttr}
      ${styleAttr}
      data-media-code="${code}"
      data-model-path="${media.path}"
    ></div>`.replace(/\s+/g, ' ').trim();
  }

  return `<!-- Type de média inconnu pour ${code} -->`;
}

/**
 * Récupère le chemin d'un média pour utilisation directe
 */
export function getPath(code: MediaCode): string {
  return mediaMap[code]?.path || '';
}

/**
 * Vérifie si un média est disponible
 */
export function isAvailable(code: MediaCode): boolean {
  return Boolean(mediaMap[code]?.path);
}

/**
 * Génère les attributs d'image pour usage inline
 */
export function getImageAttrs(code: MediaCode): { src: string; alt: string } | null {
  const media = mediaMap[code];
  if (!media || !media.path || media.type !== 'image') {
    return null;
  }
  return {
    src: media.path,
    alt: media.alt
  };
}

// Export du mapping pour accès direct si nécessaire
export { mediaMap, MediaCode, MediaItem };
