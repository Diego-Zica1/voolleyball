
// This Edge Function is meant to be run every Saturday at 14:00
// To set up the cron job, run this SQL in the Supabase SQL Editor:
/*
select
  cron.schedule(
    'create-weekly-game-saturday',
    '0 14 * * 6', -- Every Saturday at 14:00
    $$
    select
      net.http_post(
          url:='https://nkamesozxdakvvxldiza.supabase.co/functions/v1/create-weekly-game',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYW1lc296eGRha3Z2eGxkaXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MTU3NDUsImV4cCI6MjA2Mjk5MTc0NX0.7laPUBC4XIQzgGhbRo35jS-b2TpNn9xEsPLRgEWKtjY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );
*/

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Calculate date for next Saturday
    const today = new Date()
    const nextSaturday = new Date()
    
    // Find next Saturday (day 6 is Saturday)
    nextSaturday.setDate(today.getDate() + ((6 + 7 - today.getDay()) % 7))
    
    // Format date as YYYY-MM-DD
    const formattedDate = nextSaturday.toISOString().split('T')[0]
    
    // Create a game for next Saturday
    const { data, error } = await supabaseClient
      .from('games')
      .insert({
        date: formattedDate,
        time: '19:00',
        location: 'Arena Túnel - Quadra 01 | Entrada pela Rua Itaguara 55',
        max_players: 18,
        created_by: 'system'
      })
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({
        message: "Weekly game created successfully",
        data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
