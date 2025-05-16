
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
      return;
    }
    
    // 2. Atualizar perfil para ser administrador
    if (adminData?.user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', adminData.user.id);
      
      if (updateError) {
        console.error("Erro ao definir perfil como admin:", updateError);
      } else {
        console.log("Usuário admin criado com sucesso!");
      }
    }
  } catch (error) {
    console.error("Erro ao criar usuário admin:", error);
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
    } else {
      console.log("Usuário comum criado com sucesso!");
    }
  } catch (error) {
    console.error("Erro ao criar usuário comum:", error);
  }
};
