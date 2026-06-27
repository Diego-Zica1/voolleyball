-- Adicionar coluna avatar_url à tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Grant para roles necessárias
GRANT SELECT (avatar_url) ON public.profiles TO anon, authenticated, service_role;
GRANT UPDATE (avatar_url) ON public.profiles TO authenticated, service_role;