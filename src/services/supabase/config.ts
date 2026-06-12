export interface SupabaseConfig {
  url: string;
  key: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  
  return {
    url,
    key,
    isConfigured: url.trim().length > 0 && key.trim().length > 0,
  };
}
