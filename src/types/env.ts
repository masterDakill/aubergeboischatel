/**
 * Cloudflare Workers Environment Bindings - CODEX
 *
 * Interface centralisée pour tous les bindings Cloudflare Workers.
 * Utilisée dans les handlers Hono via c.env
 */

/// <reference types="@cloudflare/workers-types" />

/**
 * Interface principale des bindings Cloudflare Workers.
 * Toutes les variables d'environnement et bindings doivent être déclarés ici.
 */
export interface Env {
  // ============================================
  // MCOP HUB - Hub événementiel central
  // ============================================

  /**
   * URL du MCOP Hub (aidant_mcop_hub sur Railway)
   * Ex: https://aidant-mcop-hub-production.up.railway.app
   */
  MCOP_HUB_URL: string;

  /**
   * Token Bearer pour authentifier CODEX auprès du MCOP Hub
   */
  MCOP_HUB_TOKEN: string;

  // ============================================
  // DATABASE - Neon PostgreSQL
  // ============================================

  /**
   * URL de connexion PostgreSQL Neon
   * Format: postgresql://user:pass@host/db?sslmode=require
   */
  DATABASE_URL: string;

  // ============================================
  // FIREBASE - Authentication
  // ============================================

  /**
   * Firebase API Key (public)
   */
  FIREBASE_API_KEY?: string;

  /**
   * Firebase Auth Domain
   */
  FIREBASE_AUTH_DOMAIN?: string;

  /**
   * Firebase Project ID
   */
  FIREBASE_PROJECT_ID?: string;

  /**
   * Firebase Storage Bucket
   */
  FIREBASE_STORAGE_BUCKET?: string;

  /**
   * Firebase Messaging Sender ID
   */
  FIREBASE_MESSAGING_SENDER_ID?: string;

  /**
   * Firebase App ID
   */
  FIREBASE_APP_ID?: string;

  // ============================================
  // CLOUDFLARE SERVICES
  // ============================================

  /**
   * Cloudflare R2 Bucket pour stockage fichiers
   */
  R2_BUCKET?: R2Bucket;

  /**
   * Cloudflare KV Namespace pour cache/sessions
   */
  KV_CACHE?: KVNamespace;

  /**
   * Cloudflare KV Namespace pour sessions utilisateurs
   */
  KV_SESSIONS?: KVNamespace;

  // ============================================
  // EXTERNAL SERVICES
  // ============================================

  /**
   * Stripe Secret Key pour facturation
   */
  STRIPE_SECRET_KEY?: string;

  /**
   * Stripe Webhook Secret
   */
  STRIPE_WEBHOOK_SECRET?: string;

  /**
   * Twilio Account SID
   */
  TWILIO_ACCOUNT_SID?: string;

  /**
   * Twilio Auth Token
   */
  TWILIO_AUTH_TOKEN?: string;

  /**
   * Twilio Phone Number (from)
   */
  TWILIO_PHONE_NUMBER?: string;

  /**
   * OpenAI API Key pour fonctionnalités IA
   */
  OPENAI_API_KEY?: string;

  /**
   * Anthropic API Key pour Claude
   */
  ANTHROPIC_API_KEY?: string;

  // ============================================
  // APPLICATION CONFIG
  // ============================================

  /**
   * Environnement d'exécution
   */
  ENVIRONMENT?: 'development' | 'staging' | 'production';

  /**
   * Version de l'application CODEX
   */
  CODEX_VERSION?: string;

  /**
   * URL de base de l'application
   */
  APP_URL?: string;

  /**
   * Secret pour signer les JWT internes (si utilisé)
   */
  JWT_SECRET?: string;
}

// ============================================
// TYPE HELPERS
// ============================================

/**
 * Bindings requis pour le MCOP Hub.
 * Utile pour valider que les bindings nécessaires sont présents.
 */
export type McopHubRequiredEnv = Pick<Env, 'MCOP_HUB_URL' | 'MCOP_HUB_TOKEN'>;

/**
 * Bindings requis pour la base de données.
 */
export type DatabaseRequiredEnv = Pick<Env, 'DATABASE_URL'>;

/**
 * Bindings requis pour Firebase Auth.
 */
export type FirebaseRequiredEnv = Pick<
  Env,
  'FIREBASE_API_KEY' | 'FIREBASE_PROJECT_ID'
>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Vérifie que les bindings MCOP Hub sont configurés.
 */
export function hasMcopHubConfig(env: Partial<Env>): env is Env & McopHubRequiredEnv {
  return Boolean(env.MCOP_HUB_URL && env.MCOP_HUB_TOKEN);
}

/**
 * Vérifie que les bindings Database sont configurés.
 */
export function hasDatabaseConfig(env: Partial<Env>): env is Env & DatabaseRequiredEnv {
  return Boolean(env.DATABASE_URL);
}

/**
 * Récupère l'environnement d'exécution avec fallback.
 */
export function getEnvironment(env: Partial<Env>): 'development' | 'staging' | 'production' {
  return env.ENVIRONMENT || 'development';
}

/**
 * Récupère la version CODEX avec fallback.
 */
export function getCodexVersion(env: Partial<Env>): string {
  return env.CODEX_VERSION || '1.0.0';
}
