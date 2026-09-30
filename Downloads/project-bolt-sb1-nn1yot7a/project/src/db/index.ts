import { PGlite } from '@electric-sql/pglite';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const db = new PGlite('idb://vaultly-db');

export const supabase = createClient(supabaseUrl, supabaseKey);
export type { PGlite };
export default db;
