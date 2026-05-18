"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Ação de servidor (Server Action) para atualizar o status de uma reserva.
 * Como administradores precisam alterar reservas que não lhes pertencem,
 * é necessário o uso da Service Role Key para ignorar as regras de RLS do Supabase.
 */
export async function updateBookingStatusAdmin(bookingId: string, newStatus: "confirmado" | "cancelado" | "pendente") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "A variável de ambiente SUPABASE_SERVICE_ROLE_KEY está em falta no ficheiro .env.local! O administrador precisa desta chave para modificar as reservas dos clientes."
    );
  }

  // Cria um cliente supabase com privilégios de administrador (bypassa RLS)
  const supabaseAdmin = createClient(url, serviceKey);

  const { data, error } = await supabaseAdmin
    .from("booking")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq("id", bookingId)
    .select();

  if (error) {
    throw new Error(`Erro ao atualizar banco de dados: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Reserva não encontrada no banco de dados.");
  }

  return { success: true, data };
}
