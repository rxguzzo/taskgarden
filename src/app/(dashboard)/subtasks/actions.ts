'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '../../../services/supabase/server';
import { ActionState } from '../tasks/actions';

/**
 * Cria uma nova subtarefa vinculada a uma tarefa ativa.
 */
export async function createSubtaskAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const taskId = formData.get('task_id')?.toString();
    const title = formData.get('title')?.toString();

    // 1. Validações Básicas
    if (!taskId) {
      return { success: false, error: 'O identificador da tarefa é obrigatório.' };
    }

    if (!title || !title.trim()) {
      return { success: false, error: 'O título da subtarefa é obrigatório.' };
    }
    const cleanTitle = title.trim();
    if (cleanTitle.length > 255) {
      return { success: false, error: 'O título da subtarefa deve ter no máximo 255 caracteres.' };
    }

    // 2. Autenticação
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
    }

    // 3. Buscar a tarefa no banco para validar posse, status e obter a life_area_id
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('life_area_id, status')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (taskError || !task) {
      return { success: false, error: 'Tarefa de vinculação inválida ou excluída.' };
    }

    if (task.status !== 'ACTIVE') {
      return { success: false, error: 'Só é possível adicionar subtarefas a tarefas ativas.' };
    }

    // 4. Calcular sort_order: max(sort_order) + 1
    const { data: maxSub, error: maxSubError } = await supabase
      .from('subtasks')
      .select('sort_order')
      .eq('task_id', taskId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (maxSubError) {
      console.error('Erro ao calcular sort_order da subtarefa:', maxSubError);
    }

    const maxOrder = maxSub && maxSub.length > 0 ? maxSub[0].sort_order : -1;
    const nextOrder = maxOrder + 1;

    // 5. Inserir subtarefa
    const { error: insertError } = await supabase
      .from('subtasks')
      .insert({
        user_id: user.id,
        task_id: taskId,
        life_area_id: task.life_area_id,
        title: cleanTitle,
        is_completed: false,
        sort_order: nextOrder,
      });

    if (insertError) {
      console.error('Erro de banco ao criar subtarefa:', insertError);
      return { success: false, error: 'Falha ao registrar subtarefa no servidor.' };
    }

    // 6. Revalidação de cache
    revalidatePath('/garden');
    revalidatePath(`/garden/${task.life_area_id}`);
    revalidatePath('/tasks');
    revalidatePath('/greenhouse');
    revalidatePath('/statistics');
    revalidatePath('/focus');

    return { success: true, message: 'Subtarefa adicionada com sucesso!' };
  } catch (err) {
    console.error('Erro inesperado ao criar subtarefa:', err);
    return { success: false, error: 'Erro inesperado ao registrar subtarefa.' };
  }
}

/**
 * Atualiza o título de uma subtarefa existente.
 */
export async function updateSubtaskAction(
  subtaskId: string,
  title: string
): Promise<ActionState> {
  try {
    if (!subtaskId) {
      return { success: false, error: 'Identificador de subtarefa inválido.' };
    }

    if (!title || !title.trim()) {
      return { success: false, error: 'O título da subtarefa não pode ser vazio.' };
    }
    const cleanTitle = title.trim();
    if (cleanTitle.length > 255) {
      return { success: false, error: 'O título deve ter no máximo 255 caracteres.' };
    }

    // 1. Autenticação
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada.' };
    }

    // 2. Localizar subtarefa para validar tarefa e posse
    const { data: subtask, error: subtaskError } = await supabase
      .from('subtasks')
      .select('task_id, life_area_id')
      .eq('id', subtaskId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (subtaskError || !subtask) {
      return { success: false, error: 'Subtarefa não encontrada.' };
    }

    // 3. Validar se a tarefa está ativa
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', subtask.task_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (taskError || !task) {
      return { success: false, error: 'A tarefa vinculada foi excluída.' };
    }

    if (task.status !== 'ACTIVE') {
      return { success: false, error: 'Apenas subtarefas de tarefas ativas podem ser editadas.' };
    }

    // 4. Atualizar no banco
    const { error: updateError } = await supabase
      .from('subtasks')
      .update({
        title: cleanTitle
      })
      .eq('id', subtaskId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Erro de banco ao editar subtarefa:', updateError);
      return { success: false, error: 'Erro ao atualizar subtarefa no servidor.' };
    }

    // 5. Revalidação de cache
    revalidatePath('/garden');
    revalidatePath(`/garden/${subtask.life_area_id}`);
    revalidatePath('/tasks');
    revalidatePath('/greenhouse');
    revalidatePath('/statistics');
    revalidatePath('/focus');

    return { success: true, message: 'Subtarefa editada com sucesso!' };
  } catch (err) {
    console.error('Erro ao editar subtarefa:', err);
    return { success: false, error: 'Erro inesperado ao atualizar subtarefa.' };
  }
}

/**
 * Alterna a conclusão de uma subtarefa.
 */
export async function toggleSubtaskAction(
  subtaskId: string,
  isCompleted: boolean
): Promise<ActionState> {
  try {
    if (!subtaskId) {
      return { success: false, error: 'Identificador de subtarefa inválido.' };
    }

    // 1. Autenticação
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada.' };
    }

    // 2. Localizar subtarefa para validar tarefa e posse
    const { data: subtask, error: subtaskError } = await supabase
      .from('subtasks')
      .select('task_id, life_area_id')
      .eq('id', subtaskId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (subtaskError || !subtask) {
      return { success: false, error: 'Subtarefa não encontrada.' };
    }

    // 3. Validar se a tarefa está ativa
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', subtask.task_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (taskError || !task) {
      return { success: false, error: 'A tarefa vinculada foi excluída.' };
    }

    if (task.status !== 'ACTIVE') {
      return { success: false, error: 'Subtarefas de tarefas concluídas ou podadas não podem ser alteradas.' };
    }

    // 4. Atualizar conclusão (completed_at também será controlado pelo trigger)
    const { error: updateError } = await supabase
      .from('subtasks')
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', subtaskId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Erro de banco ao alternar status da subtarefa:', updateError);
      return { success: false, error: 'Erro ao registrar alteração de status.' };
    }

    // 5. Revalidação de cache
    revalidatePath('/garden');
    revalidatePath(`/garden/${subtask.life_area_id}`);
    revalidatePath('/tasks');
    revalidatePath('/greenhouse');
    revalidatePath('/statistics');
    revalidatePath('/focus');

    return { success: true, message: 'Status da subtarefa atualizado!' };
  } catch (err) {
    console.error('Erro ao alternar subtarefa:', err);
    return { success: false, error: 'Erro inesperado ao atualizar status.' };
  }
}

/**
 * Remove logicamente (soft-delete) uma subtarefa.
 */
export async function deleteSubtaskAction(
  subtaskId: string
): Promise<ActionState> {
  try {
    if (!subtaskId) {
      return { success: false, error: 'Identificador de subtarefa inválido.' };
    }

    // 1. Autenticação
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada.' };
    }

    // 2. Localizar subtarefa para validar tarefa e posse
    const { data: subtask, error: subtaskError } = await supabase
      .from('subtasks')
      .select('task_id, life_area_id')
      .eq('id', subtaskId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (subtaskError || !subtask) {
      return { success: false, error: 'Subtarefa não encontrada ou já removida.' };
    }

    // 3. Validar se a tarefa está ativa
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', subtask.task_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (taskError || !task) {
      return { success: false, error: 'A tarefa vinculada foi excluída.' };
    }

    if (task.status !== 'ACTIVE') {
      return { success: false, error: 'Apenas subtarefas de tarefas ativas podem ser removidas.' };
    }

    // 4. Executar soft-delete
    const { error: updateError } = await supabase
      .from('subtasks')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', subtaskId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Erro de banco ao deletar subtarefa:', updateError);
      return { success: false, error: 'Erro ao excluir subtarefa.' };
    }

    // 5. Revalidação de cache
    revalidatePath('/garden');
    revalidatePath(`/garden/${subtask.life_area_id}`);
    revalidatePath('/tasks');
    revalidatePath('/greenhouse');
    revalidatePath('/statistics');
    revalidatePath('/focus');

    return { success: true, message: 'Subtarefa removida!' };
  } catch (err) {
    console.error('Erro ao deletar subtarefa:', err);
    return { success: false, error: 'Erro inesperado ao remover subtarefa.' };
  }
}
