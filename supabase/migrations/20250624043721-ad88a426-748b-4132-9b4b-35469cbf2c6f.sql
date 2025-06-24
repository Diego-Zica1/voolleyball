
-- Criar tabela para armazenar as enquetes
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  multiple_choice BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para as opções da enquete
CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para os votos
CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(poll_id, option_id, user_id)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Políticas para polls - todos podem ver, apenas admins podem criar/editar
CREATE POLICY "Anyone can view polls" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Admins can create polls" ON public.polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update polls" ON public.polls FOR UPDATE USING (true);

-- Políticas para poll_options - todos podem ver, apenas admins podem gerenciar
CREATE POLICY "Anyone can view poll options" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Admins can manage poll options" ON public.poll_options FOR ALL USING (true);

-- Políticas para poll_votes - todos podem ver e votar
CREATE POLICY "Anyone can view poll votes" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.poll_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their votes" ON public.poll_votes FOR UPDATE USING (user_id = auth.uid());

-- Criar bucket para imagens das enquetes (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'poll-images') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('poll-images', 'poll-images', true);
    END IF;
END $$;

-- Política para o bucket de imagens
CREATE POLICY "Anyone can view poll images" ON storage.objects FOR SELECT USING (bucket_id = 'poll-images');
CREATE POLICY "Authenticated users can upload poll images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'poll-images' AND auth.role() = 'authenticated');
