import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function createBrowserClient() {
  // Evita criar cliente no SSR
  if (typeof window === 'undefined') {
    return null as any;
  }
  
  // Retorna cliente existente se já foi criado
  if (supabaseClient) {
    return supabaseClient;
  }
  
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error("Missing Supabase environment variables");
    }
    
    console.log("Creating Supabase client with URL:", url.substring(0, 20) + "...");
    
    // Cria cliente singleton com configuração única para evitar conflitos
    supabaseClient = createSupabaseBrowserClient(url, key, {
      auth: {
        storageKey: 'sb-auth-token-unique',
        autoRefreshToken: true,
        persistSession: true,
      }
    });
    
    return supabaseClient;
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    throw error;
  }
}
