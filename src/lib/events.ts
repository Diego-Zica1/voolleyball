
import { supabase } from "@/integrations/supabase/client";

export interface Event {
  id: string;
  description: string;
  date: string;
  time: string;
  location: string;
  map_location?: string | null;
  value: number;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export interface EventConfirmation {
  id: string;
  event_id: string;
  user_id: string;
  username: string;
  confirmed_at: string;
}

export interface CreateEventData {
  description: string;
  date: string;
  time: string;
  location: string;
  map_location?: string;
  value: number;
  created_by: string;
}

export const getActiveEvent = async (): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active event:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getActiveEvent:', error);
    throw error;
  }
};

export const createEvent = async (eventData: CreateEventData): Promise<Event> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          ...eventData,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createEvent:', error);
    throw error;
  }
};

export const finalizeEvent = async (eventId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('events')
      .update({ is_active: false })
      .eq('id', eventId);

    if (error) {
      console.error('Error finalizing event:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in finalizeEvent:', error);
    throw error;
  }
};

export const getEventConfirmations = async (eventId: string): Promise<EventConfirmation[]> => {
  try {
    const { data, error } = await supabase
      .from('event_confirmations')
      .select('*')
      .eq('event_id', eventId)
      .order('confirmed_at', { ascending: true });

    if (error) {
      console.error('Error fetching event confirmations:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEventConfirmations:', error);
    throw error;
  }
};

export const addEventConfirmation = async (
  eventId: string,
  userId: string,
  username: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('event_confirmations')
      .insert([
        {
          event_id: eventId,
          user_id: userId,
          username: username
        }
      ]);

    if (error) {
      console.error('Error adding event confirmation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in addEventConfirmation:', error);
    throw error;
  }
};

export const removeEventConfirmation = async (
  eventId: string,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('event_confirmations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing event confirmation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in removeEventConfirmation:', error);
    throw error;
  }
};
