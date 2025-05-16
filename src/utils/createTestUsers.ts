
import { supabase } from "@/integrations/supabase/client";

// Função para criar usuários de teste (para uso de desenvolvimento apenas)
export const createAdminUser = async () => {
  try {
    // 1. Criar usuário admin
    const { data: adminData, error: adminError } = await supabase.auth.signUp({
      email: "admin@example.com",
      password: "admin123456",
      options: {
        data: { username: "admin" }
      }
    });
    
    if (adminError) {
      console.error("Erro ao criar usuário admin:", adminError);
      return { error: adminError, success: false };
    }
    
    // 2. Atualizar perfil para ser administrador
    if (adminData?.user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', adminData.user.id);
      
      if (updateError) {
        console.error("Erro ao definir perfil como admin:", updateError);
        return { error: updateError, success: false };
      } else {
        console.log("Usuário admin criado com sucesso!");
        return { user: adminData.user, success: true };
      }
    }
    return { error: new Error('Nenhum usuário retornado pela API'), success: false };
  } catch (error) {
    console.error("Erro ao criar usuário admin:", error);
    return { error, success: false };
  }
};

export const createRegularUser = async () => {
  try {
    // Criar usuário comum
    const { data, error } = await supabase.auth.signUp({
      email: "jogador@example.com",
      password: "jogador123456",
      options: {
        data: { username: "jogador" }
      }
    });
    
    if (error) {
      console.error("Erro ao criar usuário comum:", error);
      return { error, success: false };
    } else {
      console.log("Usuário comum criado com sucesso!");
      return { user: data.user, success: true };
    }
  } catch (error) {
    console.error("Erro ao criar usuário comum:", error);
    return { error, success: false };
  }
};

export const populateTestData = async () => {
  try {
    console.log("Iniciando população de dados de teste...");
    
    // Criar um jogo de exemplo
    const { error: gameError } = await supabase
      .from('games')
      .insert({
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        location: 'Arena Túnel - Quadra 01 | Entrada pela Rua Itaguara 55',
        max_players: 18,
        created_by: 'system'
      });
    
    if (gameError) {
      console.error("Erro ao criar jogo de exemplo:", gameError);
      return { error: gameError, success: false };
    }
    
    // Criar configurações financeiras padrão
    const { error: financeError } = await supabase
      .from('finance_settings')
      .insert({
        monthly_fee: 50.0,
        weekly_fee: 20.0,
        monthly_goal: 800.0,
        pix_qrcode: 'https://placeholder.com/qrcode'
      })
      .select()
      .single();
    
    if (financeError && financeError.code !== '23505') { // Ignore duplicate key error
      console.error("Erro ao criar configurações financeiras:", financeError);
      return { error: financeError, success: false };
    }
    
    console.log("Dados de teste populados com sucesso!");
    return { success: true };
  } catch (error) {
    console.error("Erro ao popular dados de teste:", error);
    return { error, success: false };
  }
};
