'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '../../../services/supabase/server';

export interface ActionState {
  success: boolean;
  error?: string;
  message?: string;
}

const ALLOWED_COLORS = ['emerald', 'blue', 'purple', 'amber', 'rose', 'slate'];

/**
 * Cria uma nova Área da Vida (Árvore) no banco.
 */
export async function createLifeAreaAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = formData.get('name')?.toString();
    const description = formData.get('description')?.toString();
    const color = formData.get('color')?.toString();

    // Validações
    const cleanName = name ? name.trim() : '';
    if (!cleanName) {
      return { success: false, error: 'O nome da área é obrigatório.' };
    }
    if (cleanName.length > 100) {
      return { success: false, error: 'O nome deve ter no máximo 100 caracteres.' };
    }

    const cleanDesc = description ? description.trim() : '';
    if (cleanDesc.length > 500) {
      return { success: false, error: 'A descrição deve ter no máximo 500 caracteres.' };
    }

    const cleanColor = color || 'emerald';
    if (!ALLOWED_COLORS.includes(cleanColor)) {
      return { success: false, error: 'A cor selecionada é inválida.' };
    }

    // Obter usuário logado de forma segura no servidor
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
    }

    // Inserção no Supabase
    const { error: insertError } = await supabase
      .from('life_areas')
      .insert({
        user_id: user.id,
        name: cleanName,
        description: cleanDesc || null,
        color: cleanColor,
      });

    if (insertError) {
      // Tratar duplicidade de nome ativo (constraint unique_active_life_area_name_per_user)
      if (insertError.code === '23505') {
        return { success: false, error: 'Você já tem uma área ativa com este nome. Escolha outro nome.' };
      }
      console.error('Erro de banco ao criar área:', insertError);
      return { success: false, error: 'Falha no servidor ao criar área da vida.' };
    }

    // Revalidar rotas reais afetadas
    revalidatePath('/garden');
    revalidatePath('/tasks');
    revalidatePath('/statistics');

    return { success: true, message: 'Área da vida plantada com sucesso!' };
  } catch (err) {
    console.error('Erro na action createLifeAreaAction:', err);
    return { success: false, error: 'Erro inesperado ao salvar. Tente novamente.' };
  }
}

/**
 * Atualiza uma Área da Vida existente.
 */
export async function updateLifeAreaAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const areaId = formData.get('area_id')?.toString();
    const name = formData.get('name')?.toString();
    const description = formData.get('description')?.toString();
    const color = formData.get('color')?.toString();

    if (!areaId) {
      return { success: false, error: 'Identificador da área ausente.' };
    }

    // Validações
    const cleanName = name ? name.trim() : '';
    if (!cleanName) {
      return { success: false, error: 'O nome da área é obrigatório.' };
    }
    if (cleanName.length > 100) {
      return { success: false, error: 'O nome deve ter no máximo 100 caracteres.' };
    }

    const cleanDesc = description ? description.trim() : '';
    if (cleanDesc.length > 500) {
      return { success: false, error: 'A descrição deve ter no máximo 500 caracteres.' };
    }

    const cleanColor = color || 'emerald';
    if (!ALLOWED_COLORS.includes(cleanColor)) {
      return { success: false, error: 'A cor selecionada é inválida.' };
    }

    // Obter usuário logado de forma segura no servidor
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
    }

    // Atualização no Supabase
    const { error: updateError } = await supabase
      .from('life_areas')
      .update({
        name: cleanName,
        description: cleanDesc || null,
        color: cleanColor,
      })
      .eq('id', areaId)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (updateError) {
      if (updateError.code === '23505') {
        return { success: false, error: 'Você já tem outra área ativa com este nome.' };
      }
      console.error('Erro de banco ao editar área:', updateError);
      return { success: false, error: 'Falha no servidor ao atualizar área.' };
    }

    // Revalidar rotas reais
    revalidatePath('/garden');
    revalidatePath(`/garden/${areaId}`);
    revalidatePath('/tasks');
    revalidatePath('/statistics');

    return { success: true, message: 'Área atualizada com sucesso!' };
  } catch (err) {
    console.error('Erro na action updateLifeAreaAction:', err);
    return { success: false, error: 'Erro inesperado ao salvar alterações.' };
  }
}

/**
 * Executa soft delete (arquivamento) em uma área de vida.
 */
export async function archiveLifeAreaAction(areaId: string): Promise<ActionState> {
  try {
    if (!areaId) {
      return { success: false, error: 'Identificador de área inválido.' };
    }

    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
    }

    // Seta data de exclusão lógica
    const { error: deleteError } = await supabase
      .from('life_areas')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', areaId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Erro de banco ao arquivar área:', deleteError);
      return { success: false, error: 'Falha no servidor ao arquivar área da vida.' };
    }

    // Revalidar rotas reais
    revalidatePath('/garden');
    revalidatePath('/tasks');
    revalidatePath('/statistics');

    return { success: true, message: 'Área arquivada com sucesso!' };
  } catch (err) {
    console.error('Erro ao arquivar área:', err);
    return { success: false, error: 'Erro inesperado ao arquivar área.' };
  }
}
