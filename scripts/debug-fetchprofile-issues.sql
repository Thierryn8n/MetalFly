-- Script de debug para diagnosticar problemas de fetchProfile
-- Este script pode ser executado no Supabase SQL Editor para diagnosticar problemas

-- Verificar se as funções SECURITY DEFINER existem
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%bypass%'
ORDER BY routine_name;

-- Verificar as políticas RLS atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;

-- Testar a função de bypass manualmente (substitua pelo ID real do usuário)
-- SELECT * FROM public.get_user_profile_bypass('seu-user-id-aqui');

-- Verificar se há locks ou bloqueios ativos
SELECT 
  pid,
  state,
  usename,
  application_name,
  client_addr,
  query_start,
  state_change,
  query
FROM pg_stat_activity 
WHERE state != 'idle' 
  AND query LIKE '%profiles%'
ORDER BY query_start;

-- Verificar estatísticas de execução
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables 
WHERE tablename = 'profiles';

-- Verificar índices existentes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY indexname;