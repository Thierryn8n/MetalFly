"use client"

import React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/types"
import { toast } from "sonner"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  restoreSession: () => Promise<void>
  resetFetchAttempts: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  restoreSession: async () => {},
  resetFetchAttempts: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()
  
  // Flags para prevenir recursão infinita
  const [isFetchingProfile, setIsFetchingProfile] = useState(false)
  const [fetchProfileAttempts, setFetchProfileAttempts] = useState(0)
  const maxFetchProfileAttempts = 5
  const fetchProfileTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchProfile = async (userId: string, signal?: AbortSignal, retryCount = 0) => {
    const maxRetries = 3;
    
    // Prevenir recursão infinita e múltiplas tentativas
    if (isFetchingProfile) {
      console.log("fetchProfile já em execução, ignorando chamada recursiva")
      return
    }
    
    // Verificar limite de tentativas globais
    if (fetchProfileAttempts >= maxFetchProfileAttempts) {
      console.error("Limite máximo de tentativas de fetchProfile atingido")
      toast.error("Erro de conexão persistente. Por favor, recarregue a página.")
      return
    }
    
    // Incrementar contador de tentativas
    setFetchProfileAttempts(prev => prev + 1)
    
    // Limpar timeout anterior se existir
    if (fetchProfileTimeoutRef.current) {
      clearTimeout(fetchProfileTimeoutRef.current)
    }
    
    setIsFetchingProfile(true)
    
    try {
      // Add delay for retries to avoid overwhelming the server
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
        .abortSignal(signal)
      
      if (error) {
        // Handle AbortError specifically
        if (error.name === 'AbortError') {
          console.log(`Fetch abortado para usuário ${userId}`);
          return;
        }
        
        // Enhanced error logging
        console.error(`Erro ao buscar perfil (tentativa ${retryCount + 1}/${maxRetries}):`, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          statusCode: (error as any).status,
          userId: userId
        });

        // Handle specific PostgreSQL errors
        if (error.code === '42P17') {
          console.error("Erro crítico: Recursão infinita detectada na política do Supabase!");
          toast.error("Erro de configuração do banco de dados. Contate o administrador.");
          
          // Try to use SECURITY DEFINER function to bypass RLS recursion
          try {
            console.log("Tentando usar função SECURITY DEFINER para bypassar RLS...");
            const { data: profileData, error: bypassError } = await supabase
              .rpc('get_user_profile_bypass', { p_user_id: userId })
              .maybeSingle();
            
            if (bypassError) {
              console.error("Erro ao usar função SECURITY DEFINER:", bypassError);
              // Create emergency fallback profile
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await createLocalFallbackProfile(user);
              }
            } else if (profileData) {
              console.log("Perfil recuperado com sucesso via SECURITY DEFINER!");
              console.log("Role do perfil (SECURITY DEFINER):", profileData.role);
              console.log("ID do usuário (SECURITY DEFINER):", profileData.id);
              setProfile(profileData as Profile);
              
              // Also try to get pricing config using SECURITY DEFINER
              try {
                const { data: pricingData } = await supabase
                  .rpc('get_user_pricing_config_bypass', { p_user_id: userId })
                  .maybeSingle();
                
                if (pricingData) {
                  console.log("Config de preços recuperada com sucesso via SECURITY DEFINER!");
                }
              } catch (pricingError) {
                console.warn("Erro ao buscar config de preços via SECURITY DEFINER:", pricingError);
              }
            }
          } catch (securityError) {
            console.error("Erro crítico na função SECURITY DEFINER:", securityError);
            // Create emergency fallback profile
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await createLocalFallbackProfile(user);
            }
          }
          return;
        }

        // Handle server errors (5xx) with retry
        if ((error as any).status >= 500 && retryCount < maxRetries - 1) {
          console.log(`Tentando novamente em ${retryCount + 1} segundos...`);
          return fetchProfile(userId, signal, retryCount + 1);
        }

        // Auto-fix: Create profile if it doesn't exist (PGRST116 = JSON object requested, multiple (or no) rows returned)
        if (error.code === 'PGRST116') {
          console.log("Tentando criar perfil automaticamente para:", userId);
          
          // Get user metadata
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && user.id === userId) {
            const newProfile = {
              id: userId,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Novo Usuario',
              role: 'user',
              updated_at: new Date().toISOString(),
            };

            const { error: createError } = await supabase.from("profiles").upsert(newProfile);
            
            if (createError) {
              console.error("Falha ao criar perfil automatico:", createError);
              // Try alternative approach: insert instead of upsert
              if (createError.code === '23505') { // Unique violation
                const { error: insertError } = await supabase.from("profiles").insert(newProfile);
                if (insertError) {
                  console.error("Falha ao inserir perfil:", insertError);
                } else {
                  console.log("Perfil criado com sucesso (insert)!")
                  setProfile(newProfile as Profile);
                }
              }
            } else {
              console.log("Perfil criado com sucesso!")
              console.log("Role do novo perfil:", newProfile.role);
              console.log("ID do novo perfil:", newProfile.id);
              setProfile(newProfile as Profile);
              
              // Ensure pricing config exists too
              const { error: pricingError } = await supabase.from("pricing_configs").insert({
                user_id: userId,
                material_margin: 30,
                labor_hourly_rate: 80,
                profit_margin: 25,
              }).select().single();
              
              if (pricingError) {
                console.warn("Erro ao criar config de preco:", pricingError);
                // Try upsert for pricing config
                await supabase.from("pricing_configs").upsert({
                  user_id: userId,
                  material_margin: 30,
                  labor_hourly_rate: 80,
                  profit_margin: 25,
                });
              }
              
              return;
            }
          }
        }
        
        // Show user-friendly error for persistent issues
        if (retryCount === maxRetries - 1) {
          toast.error("Erro ao carregar perfil. Por favor, tente recarregar a página.");
          
          // As last resort, create a local fallback profile
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await createLocalFallbackProfile(user);
          }
        }
        
        return;
      }

      if (data) {
        setProfile(data as Profile);
        console.log("Perfil carregado com sucesso:", data);
        console.log("Role do perfil:", data.role);
        console.log("ID do usuário:", data.id);
        
        // Resetar contador de tentativas em caso de sucesso
        setFetchProfileAttempts(0)
      }
    } catch (error) {
      // Handle AbortError specifically
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        console.log(`Fetch abortado para usuário ${userId}`);
        return;
      }
      
      console.error("Exceção ao buscar perfil:", error);
      if (retryCount < maxRetries - 1) {
        console.log(`Tentando novamente após exceção (tentativa ${retryCount + 2}/${maxRetries})...`);
        return fetchProfile(userId, signal, retryCount + 1);
      }
      toast.error("Erro de conexão. Por favor, verifique sua internet.");
    } finally {
      // Sempre resetar a flag de proteção após delay
      fetchProfileTimeoutRef.current = setTimeout(() => {
        setIsFetchingProfile(false)
      }, 100)
    }
  }



  const createLocalFallbackProfile = async (user: User): Promise<Profile> => {
    let role: UserRole = 'user';
    
    // Try to get the actual role from server using bypass function
    try {
      const { data: roleData } = await supabase
        .rpc('get_user_profile_bypass', { p_user_id: user.id })
        .select('role')
        .maybeSingle();
      
      if (roleData?.role) {
        role = roleData.role as UserRole;
        console.log("Role obtido via bypass:", role);
      }
    } catch (error) {
      console.warn("Não foi possível obter role via bypass, usando 'user' como padrão:", error);
    }
    
    const fallbackProfile: Profile = {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: null,
      phone: null,
      company: null,
    };
    
    console.warn("Usando perfil local temporário - servidor indisponível");
    console.log("Role definido para fallback:", role);
    setProfile(fallbackProfile as Profile);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem(`fallback_profile_${user.id}`, JSON.stringify(fallbackProfile));
    }
    
    return fallbackProfile;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const resetFetchAttempts = () => {
    setFetchProfileAttempts(0)
    console.log("Contador de tentativas de fetchProfile resetado")
  }

  const restoreSession = async () => {
    console.log("Tentando restaurar sessão...")
    try {
      setLoading(true)
      
      // Verificar se há token no localStorage
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('sb-auth-token-unique')
        if (storedToken) {
          console.log("Token encontrado, verificando validade...")
          
          // Forçar refresh do token
          const { data, error } = await supabase.auth.refreshSession()
          
          if (error) {
            console.error("Erro ao refresh token:", error)
            // Se refresh falhar, tentar getUser direto
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            if (currentUser) {
              setUser(currentUser)
              await fetchProfile(currentUser.id)
            }
          } else if (data?.session) {
            console.log("Sessão restaurada com sucesso!")
            setUser(data.session.user)
            await fetchProfile(data.session.user.id)
          }
        } else {
          console.log("Nenhum token encontrado no localStorage")
        }
      }
    } catch (error) {
      console.error("Erro ao restaurar sessão:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()
    const signal = controller.signal

    const initAuth = async () => {
      try {
        console.log("Iniciando auth... Verificando sessão existente")
        
        // Primeiro, verificar se há uma sessão válida no localStorage
        if (typeof window !== 'undefined') {
          const storedSession = localStorage.getItem('sb-auth-token-unique');
          if (storedSession) {
            console.log("Token de autenticação encontrado no localStorage")
          }
        }
        
        // Usar getSession ao invés de getUser para performance inicial melhor
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        console.log("Sessão recuperada:", session ? "Sim" : "Não")

        if (mounted) {
          if (session?.user) {
            console.log("Usuário encontrado na sessão:", session.user.id)
            setUser(session.user)
            
            // Check for existing fallback profile first
            if (typeof window !== 'undefined') {
              const fallbackKey = `fallback_profile_${session.user.id}`;
              const storedFallback = localStorage.getItem(fallbackKey);
              if (storedFallback) {
                try {
                  const fallbackData = JSON.parse(storedFallback);
                  setProfile(fallbackData as Profile);
                  console.log("Perfil fallback local encontrado");
                } catch (e) {
                  console.warn("Erro ao carregar perfil fallback:", e);
                  localStorage.removeItem(fallbackKey);
                }
              }
            }
            
            await fetchProfile(session.user.id, signal)
          } else {
            console.log("Nenhum usuário na sessão")
            setUser(null)
            setProfile(null)
          }
        }
      } catch (error) {
        console.error("Erro na inicializacao do auth:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log("Auth state change event:", event)
        console.log("Session exists:", !!session)
        
        // Se for login inicial ou token refresh, atualiza estado
        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        if (currentUser) {
          console.log("Usuário autenticado:", currentUser.id)
          // Apenas busca o perfil se o usuário mudou ou se não temos perfil ainda
          if (user?.id !== currentUser.id || !profile) {
             // Adicionar pequeno delay para evitar recursão rápida
             await new Promise(resolve => setTimeout(resolve, 100))
             await fetchProfile(currentUser.id, signal)
          }
        } else {
          console.log("Usuário deslogado")
          setProfile(null)
          // Limpar fallback profiles ao deslogar
          if (typeof window !== 'undefined') {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('fallback_profile_'));
            keys.forEach(key => localStorage.removeItem(key));
          }
        }
        
        setLoading(false)
      }
    )

    // Safety timeout para garantir que o loading não fique preso para sempre
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth loading timed out, forcing completion")
        setLoading(false)
      }
    }, 5000)

    return () => {
      mounted = false
      clearTimeout(safetyTimer)
      if (fetchProfileTimeoutRef.current) {
        clearTimeout(fetchProfileTimeoutRef.current)
      }
      subscription.unsubscribe()
      controller.abort() // Cleanup: Aborta fetches pendentes
    }
  }, [])

  const signOut = async () => {
    try {
      console.log("Iniciando processo de logout...")
      
      // Clear local state immediately for better UX
      setUser(null)
      setProfile(null)
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear() // Clear all app data
      }

      // Call Supabase signOut
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      console.log("Logout realizado com sucesso")
      
      // Force reload to clear any remaining state and redirect to login
      window.location.href = '/auth/login'
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      toast.error("Erro ao sair do sistema")
      
      // Force redirect even on error to ensure user is "logged out" locally
      window.location.href = '/auth/login'
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, restoreSession, resetFetchAttempts }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
