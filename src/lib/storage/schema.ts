/**
 * LocalStorage Schema Management
 * Feature: 001-image-text-extraction
 * Handles localStorage initialization, access, and versioning
 */

import { LocalStorageSchema } from '@/types/question';

const STORAGE_KEY = 'incorrect-questions-data';
const VERSION_KEY = 'incorrect-questions-schema-version';
const CURRENT_VERSION = '1.0.0';

/**
 * Initialize storage on first app load
 * Creates a new schema if none exists, or validates existing schema version
 */
export function initializeStorage(): LocalStorageSchema {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    throw new Error('Storage can only be initialized in browser environment');
  }

  const existingData = localStorage.getItem(STORAGE_KEY);

  if (existingData) {
    // Data exists, validate version
    const schema: LocalStorageSchema = JSON.parse(existingData);
    const storedVersion = schema.version;

    if (storedVersion !== CURRENT_VERSION) {
      // Future: Trigger migration
      console.warn(`Schema migration needed: ${storedVersion} → ${CURRENT_VERSION}`);
      throw new Error(`Schema migration needed: ${storedVersion} → ${CURRENT_VERSION}`);
    }

    return schema;
  }

  // First-time initialization
  const newSchema: LocalStorageSchema = {
    version: '1.0.0',
    questions: {},
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      totalQuestions: 0,
    },
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSchema));
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION);

  return newSchema;
}

/**
 * Get current schema from localStorage
 * Initializes if not exists
 */
export function getSchema(): LocalStorageSchema {
  if (typeof window === 'undefined') {
    // Return empty schema for SSR
    return {
      version: '1.0.0',
      questions: {},
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        totalQuestions: 0,
      },
    };
  }

  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return initializeStorage();
  }

  return JSON.parse(data) as LocalStorageSchema;
}

/**
 * Save schema to localStorage
 * Handles quota exceeded errors
 */
export function saveSchema(schema: LocalStorageSchema): void {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save schema in non-browser environment');
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('Storage is full. Please delete old questions to make space.');
    }
    throw error;
  }
}

/**
 * Get storage metrics
 * Returns usage statistics
 */
export interface StorageMetrics {
  totalQuestions: number;
  confirmedQuestions: number;
  pendingQuestions: number;
  failedQuestions: number;
  estimatedSizeKB: number;
  percentUsed: number; // Estimated percentage of localStorage quota
}

export async function getStorageMetrics(): Promise<StorageMetrics> {
  const schema = getSchema();
  const questions = Object.values(schema.questions);

  const dataString = localStorage.getItem(STORAGE_KEY) || '';
  const sizeBytes = new Blob([dataString]).size;
  const sizeKB = Math.round(sizeBytes / 1024);

  // Estimate localStorage quota (typically 5-10MB)
  let percentUsed = 0;
  try {
    const estimate = await navigator.storage?.estimate();
    const quotaBytes = estimate?.quota || 10 * 1024 * 1024; // Default 10MB
    percentUsed = (sizeBytes / quotaBytes) * 100;
  } catch (error) {
    // navigator.storage not available, use fallback
    const estimatedQuota = 5 * 1024 * 1024; // Conservative 5MB estimate
    percentUsed = (sizeBytes / estimatedQuota) * 100;
  }

  return {
    totalQuestions: schema.metadata.totalQuestions,
    confirmedQuestions: questions.filter(q => q.confirmedAt !== null).length,
    pendingQuestions: questions.filter(q => q.processingStatus === 'pending').length,
    failedQuestions: questions.filter(q => q.processingStatus === 'failed').length,
    estimatedSizeKB: sizeKB,
    percentUsed: Math.round(percentUsed * 100) / 100,
  };
}
