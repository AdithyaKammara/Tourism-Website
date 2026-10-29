/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    /** Null when Supabase keys are missing from .env. */
    supabase: import('@supabase/supabase-js').SupabaseClient | null;
    user: import('@supabase/supabase-js').User | null;
  }
}
