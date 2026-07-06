import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_KEY. Copia .env.example a .env y complétalo.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
