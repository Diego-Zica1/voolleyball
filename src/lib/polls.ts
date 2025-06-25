
import { supabase } from "@/integrations/supabase/client";

export interface Poll {
  id: string;
  title: string;
  description: string;
  multiple_choice: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  name: string;
  image_url?: string;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  username: string;
  created_at: string;
}

export interface PollWithOptions extends Poll {
  options: PollOption[];
  votes: PollVote[];
}

export async function createPoll(pollData: {
  title: string;
  description: string;
  multiple_choice: boolean;
  created_by: string;
  options: { name: string; image_url?: string }[];
}) {
  // Criar a enquete
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({
      title: pollData.title,
      description: pollData.description,
      multiple_choice: pollData.multiple_choice,
      created_by: pollData.created_by,
    })
    .select()
    .single();

  if (pollError) throw pollError;

  // Criar as opções
  const optionsToInsert = pollData.options.map(option => ({
    poll_id: poll.id,
    name: option.name,
    image_url: option.image_url,
  }));

  const { error: optionsError } = await supabase
    .from('poll_options')
    .insert(optionsToInsert);

  if (optionsError) throw optionsError;

  return poll;
}

export async function getActivePolls(): Promise<PollWithOptions[]> {
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (pollsError) throw pollsError;

  const pollsWithData = await Promise.all(
    polls.map(async (poll) => {
      // Buscar opções
      const { data: options, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', poll.id)
        .order('created_at');

      if (optionsError) throw optionsError;

      // Buscar votos
      const { data: votes, error: votesError } = await supabase
        .from('poll_votes')
        .select('*')
        .eq('poll_id', poll.id);

      if (votesError) throw votesError;

      return {
        ...poll,
        options: options || [],
        votes: votes || [],
      };
    })
  );

  return pollsWithData;
}

export async function votePoll(pollId: string, optionIds: string[], userId: string, username: string) {
  // Primeiro, remover votos existentes do usuário nesta enquete (correção do bug)
  const { error: deleteError } = await supabase
    .from('poll_votes')
    .delete()
    .eq('poll_id', pollId)
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  // Inserir novos votos
  const votesToInsert = optionIds.map(optionId => ({
    poll_id: pollId,
    option_id: optionId,
    user_id: userId,
    username: username,
  }));

  const { error } = await supabase
    .from('poll_votes')
    .insert(votesToInsert);

  if (error) throw error;
}

export async function updatePoll(pollId: string, pollData: {
  title: string;
  description: string;
  multiple_choice: boolean;
  options: { id?: string; name: string; image_url?: string }[];
}) {
  // Atualizar a enquete
  const { error: pollError } = await supabase
    .from('polls')
    .update({
      title: pollData.title,
      description: pollData.description,
      multiple_choice: pollData.multiple_choice,
    })
    .eq('id', pollId);

  if (pollError) throw pollError;

  // Buscar opções existentes
  const { data: existingOptions, error: fetchError } = await supabase
    .from('poll_options')
    .select('*')
    .eq('poll_id', pollId);

  if (fetchError) throw fetchError;

  // Separar opções para atualizar, criar e deletar
  const optionsToUpdate = pollData.options.filter(option => option.id);
  const optionsToCreate = pollData.options.filter(option => !option.id);
  const existingOptionIds = optionsToUpdate.map(opt => opt.id);
  const optionsToDelete = existingOptions.filter(opt => !existingOptionIds.includes(opt.id));

  // Deletar opções removidas
  if (optionsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('poll_options')
      .delete()
      .in('id', optionsToDelete.map(opt => opt.id));

    if (deleteError) throw deleteError;
  }

  // Atualizar opções existentes
  for (const option of optionsToUpdate) {
    const { error: updateError } = await supabase
      .from('poll_options')
      .update({
        name: option.name,
        image_url: option.image_url,
      })
      .eq('id', option.id);

    if (updateError) throw updateError;
  }

  // Criar novas opções
  if (optionsToCreate.length > 0) {
    const optionsToInsert = optionsToCreate.map(option => ({
      poll_id: pollId,
      name: option.name,
      image_url: option.image_url,
    }));

    const { error: createError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (createError) throw createError;
  }
}

export async function uploadPollImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('poll-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('poll-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function closePoll(pollId: string) {
  const { error } = await supabase
    .from('polls')
    .update({ is_active: false })
    .eq('id', pollId);

  if (error) throw error;
}
