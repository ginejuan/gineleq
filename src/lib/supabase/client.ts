/**
 * Supabase Client Wrapper
 * 
 * Capa de abstracción sobre @supabase/supabase-js.
 * Si se cambia el proveedor de base de datos, solo se modifica este archivo.
 * 
 * Principio: Agnosticismo de dependencias (ver arquitectura.md §13)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --------------------------------------------------------------------------
// Validación de entorno (fail-fast)
// --------------------------------------------------------------------------

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawUrl || !rawKey) {
  throw new Error(
    '[GineLeq] Faltan variables de entorno de Supabase. ' +
    'Copia .env.local.example a .env.local y rellena los valores.'
  );
}

const supabaseUrl: string = rawUrl;
const supabaseAnonKey: string = rawKey;

// --------------------------------------------------------------------------
// Cliente Singleton (browser / server component)
// --------------------------------------------------------------------------

let clientInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

// --------------------------------------------------------------------------
// Interfaz pública (Wrapper agnóstico)
// --------------------------------------------------------------------------

export interface DatabaseClient {
  /** Acceso directo al cliente Supabase (para consultas complejas) */
  readonly raw: SupabaseClient;

  /** 
   * Consulta genérica a una tabla con filtros opcionales.
   * Retorna los datos o lanza un error.
   */
  query<T = Record<string, unknown>>(
    table: string,
    options?: {
      select?: string;
      filters?: Record<string, unknown>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
    }
  ): Promise<T[]>;

  /**
   * Upsert (insert o update) basado en la clave primaria.
   * Diseñado para la sincronización Excel → BD.
   */
  upsert<T = Record<string, unknown>>(
    table: string,
    data: Partial<T> | Partial<T>[],
    onConflict?: string
  ): Promise<T[]>;
}

function createDatabaseClient(): DatabaseClient {
  const client = getSupabaseClient();

  return {
    get raw() {
      return client;
    },

    async query<T = Record<string, unknown>>(
      table: string,
      options?: {
        select?: string;
        filters?: Record<string, unknown>;
        orderBy?: { column: string; ascending?: boolean };
        limit?: number;
      }
    ): Promise<T[]> {
      let queryBuilder = client
        .from(table)
        .select(options?.select ?? '*');

      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      }

      if (options?.orderBy) {
        queryBuilder = queryBuilder.order(
          options.orderBy.column,
          { ascending: options.orderBy.ascending ?? true }
        );
      }

      if (options?.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw new Error(`[GineLeq DB] Error consultando ${table}: ${error.message}`);
      }

      return (data ?? []) as T[];
    },

    async upsert<T = Record<string, unknown>>(
      table: string,
      data: Partial<T> | Partial<T>[],
      onConflict?: string
    ): Promise<T[]> {
      const { data: result, error } = await client
        .from(table)
        .upsert(data as Record<string, unknown>[], {
          onConflict: onConflict ?? 'rdq',
        })
        .select();

      if (error) {
        throw new Error(`[GineLeq DB] Error en upsert ${table}: ${error.message}`);
      }

      return (result ?? []) as T[];
    },
  };
}

/** Instancia singleton del cliente de base de datos */
export const db: DatabaseClient = createDatabaseClient();
