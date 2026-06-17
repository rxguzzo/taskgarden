'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '../../../services/supabase/server';
import { ActionState } from '../tasks/actions';

/**
 * Cria um registro de tempo (Sessão de Trabalho) manual.
 */
export async function createWorkSessionAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const taskId = formData.get('task_id')?.toString();
    const durationInput = formData.get('duration_minutes')?.toString();
    const workedAtInput = formData.get('worked_at')?.toString();
    const note = formData.get('note')?.toString();

    // 1. Validações Básicas
    if (!taskId) {
      return { success: false, error: 'O identificador de tarefa é obrigatório.' };
    }

    if (!durationInput) {
      return { success: false, error: 'A duração é obrigatória.' };
    }
    const durationMinutes = parseInt(durationInput, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0 || durationMinutes > 720) {
      return { success: false, error: 'A duração deve ser um valor inteiro entre 1 e 720 minutos (12 horas).' };
    }

    if (!workedAtInput) {
      return { success: false, error: 'A data do trabalho é obrigatória.' };
    }
    // workedAtInput deve ser YYYY-MM-DD
    const workedAtPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!workedAtPattern.test(workedAtInput)) {
      return { success: false, error: 'A data informada está em formato inválido.' };
    }

    const cleanNote = note ? note.trim() : '';
    if (cleanNote.length > 1000) {
      return { success: false, error: 'As anotações devem ter no máximo 1000 caracteres.' };
    }

    // 2. Autenticação
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
    }

    // 3. Buscar a tarefa no banco para validar posse, status e obter a life_area_id correspondente
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('life_area_id, status')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (taskError || !task) {
      return { success: false, error: 'Tarefa inválida, excluída ou pertencente a outro usuário.' };
    }

    if (task.status === 'PRUNED') {
      return { success: false, error: 'Não é possível registrar tempo em uma semente podada.' };
    }

    // 4. Validar se a Área de Vida está ativa (não foi deletada)
    const { data: area, error: areaError } = await supabase
      .from('life_areas')
      .select('id')
      .eq('id', task.life_area_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (areaError || !area) {
      return { success: false, error: 'A área da vida desta tarefa foi arquivada ou excluída.' };
    }

    // 5. Inserir a Sessão de Trabalho
    const { error: insertError } = await supabase
      .from('work_sessions')
      .insert({
        user_id: user.id,
        task_id: taskId,
        life_area_id: task.life_area_id,
        duration_minutes: durationMinutes,
        worked_at: workedAtInput,
        note: cleanNote || null,
        source: 'MANUAL',
      });

    if (insertError) {
      console.error('Erro de banco ao criar sessão de trabalho:', insertError);
      return { success: false, error: insertError.message || 'Falha ao registrar sessão de trabalho.' };
    }

    // 6. Revalidação dos caminhos
    revalidatePath('/garden');
    revalidatePath(`/garden/${task.life_area_id}`);
    revalidatePath('/tasks');
    revalidatePath('/greenhouse');
    revalidatePath('/statistics');

    return { success: true, message: 'Tempo dedicado registrado com sucesso!' };
  } catch (err) {
    console.error('Erro ao registrar tempo:', err);
    return { success: false, error: 'Erro inesperado ao registrar tempo.' };
  }
}

/**
 * Remove (soft-delete) uma sessão de trabalho existente.
 */
export async function deleteWorkSessionAction(sessionId: string): Promise<ActionState> {
  try {
    if (!sessionId) {
      return { success: false, error: 'Identificador de sessão inválido.' };
    }

    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada.' };
    }

    // 1. Localizar a sessão para obter o life_area_id (revalidação) e validar dono
    const { data: session, error: sessionError } = await supabase
      .from('work_sessions')
      .select('life_area_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Sessão de trabalho não encontrada ou já removida.' };
    }

    // 2. Executar o soft delete
    const { error: updateError } = await supabase
      .from('work_sessions')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Erro ao deletar sessão de trabalho:', updateError);
      return { success: false, error: 'Erro ao remover o registro de tempo.' };
    }

    // 3. Revalidar caminhos
    revalidatePath('/garden');
    revalidatePath(`/garden/${session.life_area_id}`);
    revalidatePath('/tasks');
    revalidatePath('/greenhouse');
    revalidatePath('/statistics');

    return { success: true, message: 'Registro de tempo removido com sucesso.' };
  } catch (err) {
    console.error('Erro ao remover sessão de trabalho:', err);
    return { success: false, error: 'Erro inesperado ao remover registro de tempo.' };
  }
}
