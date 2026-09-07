// =============================================================================
// CivicConnect TN — Supabase PostgreSQL Database Migration Runner
// =============================================================================

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  console.log('\n=============================================================================');
  console.log('🚀 CivicConnect TN — Applying Migrations to Remote Supabase Database');
  console.log('=============================================================================\n');

  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    connectionString = 'postgresql://postgres:Prassath%402007@db.hhjtmdrghuqelgsfeumr.supabase.co:5432/postgres';
  }

  // Handle direct vs pooler connection
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    console.log('  ⏳ Connecting to PostgreSQL database at Supabase...');
    await client.connect();
    console.log('  ✅ Connected successfully to PostgreSQL database!\n');

    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`--- Applying ${migrationFiles.length} Database Migrations ---`);
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`  ▶ Executing migration: ${file}...`);
      try {
        await client.query(sql);
        console.log(`  ✅ Success: ${file}`);
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        // If type or table already exists, continue gracefully
        if (error.code === '42710' || error.code === '42P07' || error.message?.includes('already exists')) {
          console.log(`  ℹ Notice: ${file} (already exists or partially applied)`);
        } else {
          console.error(`  ❌ Error applying ${file}:`, error.message);
          throw err;
        }
      }
    }

    // Apply Seed Data
    const seedDir = path.join(__dirname, '..', 'supabase', 'seed');
    if (fs.existsSync(seedDir)) {
      const seedFiles = fs
        .readdirSync(seedDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      console.log(`\n--- Applying ${seedFiles.length} Seed Data Files ---`);
      for (const file of seedFiles) {
        const filePath = path.join(seedDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        console.log(`  ▶ Executing seed: ${file}...`);
        try {
          await client.query(sql);
          console.log(`  ✅ Success: ${file}`);
        } catch (err: unknown) {
          const error = err as { code?: string; message?: string };
          if (error.code === '23505' || error.message?.includes('duplicate key')) {
            console.log(`  ℹ Notice: ${file} (seed data already present)`);
          } else {
            console.warn(`  ⚠️ Warning on seed ${file}:`, error.message);
          }
        }
      }
    }

    console.log('\n=============================================================================');
    console.log('🎉 All Database Migrations & Seeds Applied Successfully to Supabase!');
    console.log('=============================================================================\n');
  } catch (error) {
    console.error('\n❌ Migration Failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
