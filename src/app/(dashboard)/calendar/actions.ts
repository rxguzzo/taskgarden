'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '../../../services/supabase/server';
import { ActionState } from '../tasks/actions';
import { HabitFrequency } from '../../../domain/growth/types';
import { getTodayDateOnly, getIsoWeekKey } from '../../../utils/date';

const ALLOWED_FREQUENCIES: HabitFrequency[] = ['DAILY', 'WEEKDAYS', 'CUSTOM_WEEKLY', 'WEEKLY', 'MONTHLY'];

/**
 * Cria uma nova rotina (Hábito) no banco vinculada a uma Área da Vida.
 */
export async function createHabitAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const lifeAreaId = formData.get('life_area_id')?.toString();
    const frequency = formData.get('frequency')?.toString() as HabitFrequency;

    // 1. Validações básicas
    const cleanTitle = title ? title.trim() : '';
    if (!cleanTitle) {
      return { success: false, error: 'O título da rotina é obrigatório.' };
    }
    if (cleanTitle.length > 255) {
      return { success: false, error: 'O título deve ter no máximo 255 caracteres.' };
    }

    const cleanDesc = description ? description.trim() : '';
    if (cleanDesc.length > 1000) {
      return { success: false, error: 'A descrição deve ter no máximo 1000 caracteres.' };
    }

    if (!lifeAreaId) {
      return { success: false, error: 'A área da vida é obrigatória.' };
    }

    if (!frequency || !ALLOWED_FREQUENCIES.includes(frequency)) {
      return { success: false, error: 'Frequência inválida.' };
    }

    let customDaysParsed: number[] = [];
    let dayOfMonthParsed: number | null = null;

    if (frequency === 'CUSTOM_WEEKLY') {
      const daysInput = formData.getAll('custom_days');
      if (daysInput.length === 0) {
        return { success: false, error: 'Selecione pelo menos um dia da semana para a frequência personalizada.' };
      }
      
      const parsed = daysInput.map(d => parseInt(d.toString(), 10));
      const hasInvalid = parsed.some(d => isNaN(d) || d < 0 || d > 6);
      if (hasInvalid) {
        return { success: false, error: 'Dias da semana inválidos selecionados.' };
      }

      // Remove duplicados e ordena de forma ascendente
      customDaysParsed = Array.from(new Set(parsed)).sort((a, b) => a - b);
    } else if (frequency === 'MONTHLY') {
      const domInput = formData.get('day_of_month')?.toString();
      if (!domInput) {
        return { success: false, error: 'O dia do mês é obrigatório para a frequência mensal.' };
      }
      
      const domInt = parseInt(domInput, 10);
      if (isNaN(domInt) || domInt < 1 || domInt > 31) {
        return { success: false, error: 'O dia do mês deve estar entre 1 e 31.' };
      }
      dayOfMonthParsed = domInt;
    }

    // 2. Autenticação do Usuário
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
    }

    // 3. Validar se a Área da Vida pertence ao usuário e não está arquivada
    const { data: area, error: areaError } = await supabase
      .from('life_areas')
      .select('id')
      .eq('id', lifeAreaId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (areaError || !area) {
      return { success: false, error: 'Área da vida inválida ou arquivada.' };
    }

    // 4. Gravação da Rotina
    const { error: insertError } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        life_area_id: lifeAreaId,
        title: cleanTitle,
        description: cleanDesc || null,
        frequency,
        custom_days: frequency === 'CUSTOM_WEEKLY' ? customDaysParsed : [],
        day_of_month: frequency === 'MONTHLY' ? dayOfMonthParsed : null,
        is_active: true
      });

    if (insertError) {
      console.error('Erro ao inserir rotina:', insertError);
      return { success: false, error: 'Erro interno ao salvar a rotina no banco.' };
    }

    revalidatePath('/calendar');
    revalidatePath('/garden');

    return { success: true, message: 'Rotina criada com sucesso!' };
  } catch (err) {
    console.error('Exceção no createHabitAction:', err);
    return { success: false, error: 'Ocorreu um erro inesperado ao salvar a rotina.' };
  }
}

/**
 * Alterna (marca/desmarca) a conclusão de uma rotina para um determinado dia.
 */
export async function toggleHabitCompletionAction(
  habitId: string
): Promise<ActionState> {
  try {
    const dateStr = getTodayDateOnly();

    // 1. Autenticação do Usuário
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
    }

    // 2. Validar se o Hábito pertence ao usuário e não está deletado
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id, frequency')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (habitError || !habit) {
      return { success: false, error: 'Rotina não encontrada.' };
    }

    let periodType: 'DAY' | 'WEEK' | 'MONTH' = 'DAY';
    let periodKey = dateStr;

    if (habit.frequency === 'WEEKLY') {
      periodType = 'WEEK';
      periodKey = getIsoWeekKey(dateStr);
    } else if (habit.frequency === 'MONTHLY') {
      periodType = 'MONTH';
      periodKey = dateStr.substring(0, 7);
    }

    // 3. Verificar se já existe a conclusão registrada para este período
    const { data: existing, error: selectError } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .eq('period_type', periodType)
      .eq('period_key', periodKey)
      .maybeSingle();

    if (selectError) {
      console.error('Erro ao buscar conclusão de rotina:', selectError);
      return { success: false, error: 'Erro de banco ao verificar conclusão.' };
    }

    if (existing) {
      // Caso já esteja concluído, desmarca (remove a linha)
      const { error: deleteError } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', existing.id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Erro ao deletar conclusão de rotina:', deleteError);
        return { success: false, error: 'Erro ao desmarcar a rotina.' };
      }
    } else {
      // Caso não esteja concluído, marca (insere a linha)
      const { error: insertError } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_date: dateStr,
          period_type: periodType,
          period_key: periodKey
        });

      if (insertError) {
        console.error('Erro ao inserir conclusão de rotina:', insertError);
        return { success: false, error: 'Erro ao marcar a rotina.' };
      }
    }

    revalidatePath('/calendar');
    return { success: true };
  } catch (err) {
    console.error('Exceção no toggleHabitCompletionAction:', err);
    return { success: false, error: 'Ocorreu um erro inesperado ao alternar a rotina.' };
  }
}

/**
 * Realiza o arquivamento (soft-delete) de uma rotina.
 */
export async function archiveHabitAction(habitId: string): Promise<ActionState> {
  try {
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
    }

    const { error: updateError } = await supabase
      .from('habits')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Erro ao arquivar rotina:', updateError);
      return { success: false, error: 'Erro ao arquivar a rotina.' };
    }

    revalidatePath('/calendar');
    revalidatePath('/garden');
    return { success: true, message: 'Rotina arquivada com sucesso!' };
  } catch (err) {
    console.error('Exceção no archiveHabitAction:', err);
    return { success: false, error: 'Ocorreu um erro inesperado ao arquivar a rotina.' };
  }
}
