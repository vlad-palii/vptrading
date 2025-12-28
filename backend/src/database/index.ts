import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Database');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database.Database | null = null;

/**
 * Initialize database connection and run schema
 */
export function initDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  const dbPath = config.database.path;
  const dbDir = dirname(dbPath);

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
    logger.info('Created database directory', { path: dbDir });
  }

  // Create database connection
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');

  // Run schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  db.exec(schema);

  logger.info('Database initialized', { path: dbPath });

  return db;
}

/**
 * Get database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

/**
 * Helper to convert price to integer (cents)
 */
export function priceToCents(price: number): number {
  return Math.round(price * 100);
}

/**
 * Helper to convert cents to price
 */
export function centsToPrice(cents: number): number {
  return cents / 100;
}

/**
 * Helper to convert quantity to integer (satoshis - 8 decimals)
 */
export function quantityToSatoshis(quantity: number): number {
  return Math.round(quantity * 100000000);
}

/**
 * Helper to convert satoshis to quantity
 */
export function satoshisToQuantity(satoshis: number): number {
  return satoshis / 100000000;
}

/**
 * Get current UTC date string in YYYY-MM-DD format
 */
export function getCurrentUTCDate(): string {
  return new Date().toISOString().split('T')[0]!;
}

/**
 * Get current timestamp in milliseconds
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}
