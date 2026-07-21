'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '../../../services/supabase/server';

export interface ActionState {
  success: boolean;
  error?: string;
  message?: string;
}

const ALLOWED_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'VERY_HARD'];
const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

/**
 * Cria uma nova semente (Tarefa) no banco vinculada a uma Área da Vida.
 */
export async function createTaskAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const difficulty = formData.get('difficulty')?.toString();
    const priority = formData.get('priority')?.toString();
    const lifeAreaId = formData.get('life_area_id')?.toString();
    const dueDateInput = formData.get('due_date')?.toString();

    // 1. Validações básicas no servidor
    const cleanTitle = title ? title.trim() : '';
    if (!cleanTitle) {
      return { success: false, error: 'O título da semente é obrigatório.' };
    }
    if (cleanTitle.length > 255) {
      return { success: false, error: 'O título deve ter no máximo 255 caracteres.' };
    }

    const cleanDesc = description ? description.trim() : '';
    if (cleanDesc.length > 1000) {
      return { success: false, error: 'A descrição deve ter no máximo 1000 caracteres.' };
    }

    const cleanDifficulty = difficulty || 'MEDIUM';
    if (!ALLOWED_DIFFICULTIES.includes(cleanDifficulty)) {
      return { success: false, error: 'Dificuldade inválida.' };
    }

    const cleanPriority = priority || 'MEDIUM';
    if (!ALLOWED_PRIORITIES.includes(cleanPriority)) {
      return { success: false, error: 'Prioridade inválida.' };
    }

    if (!lifeAreaId) {
      return { success: false, error: 'A área da vida é obrigatória.' };
    }

    // Validação de data
    let cleanDueDate: string | null = null;
    if (dueDateInput && dueDateInput.trim()) {
      const trimmed = dueDateInput.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return { success: false, error: 'A data informada é inválida.' };
      }
      cleanDueDate = trimmed;
    }

    // 2. Conexão e Validação de Sessão
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
    }

    // 3. Validar se a Área da Vida pertence ao usuário e NÃO está arquivada
    const { data: area, error: areaError } = await supabase
      .from('life_areas')
      .select('id')
      .eq('id', lifeAreaId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (areaError || !area) {
      return { success: false, error: 'Área da vida inválida ou arquivada. Crie uma nova área ativa.' };
    }

    // 4. Inserção da Tarefa
    const { error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        life_area_id: lifeAreaId,
        title: cleanTitle,
        description: cleanDesc || null,
        status: 'ACTIVE',
        progress: 0,
        difficulty: cleanDifficulty,
        priority: cleanPriority,
        due_date: cleanDueDate,
      });

    if (insertError) {
      console.error('Erro de banco ao criar tarefa:', insertError);
      return { success: false, error: 'Falha no servidor ao plantar semente.' };
    }

    // 5. Revalidação de caminhos reais
    revalidatePath('/garden');
    revalidatePath(`/garden/${lifeAreaId}`);
    revalidatePath('/tasks');
    revalidatePath('/statistics');

    return { success: true, message: 'Semente plantada com sucesso!' };
  } catch (err) {
    console.error('Erro na action createTaskAction:', err);
    return { success: false, error: 'Erro inesperado ao criar tarefa.' };
  }
}

/**
 * Atualiza os campos de uma tarefa ativa existente.
 */
export async function updateTaskAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const taskId = formData.get('task_id')?.toString();
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const difficulty = formData.get('difficulty')?.toString();
    const priority = formData.get('priority')?.toString();
    const progressInput = formData.get('progress')?.toString();
    const dueDateInput = formData.get('due_date')?.toString();

    if (!taskId) {
      return { success: false, error: 'Identificador de tarefa ausente.' };
    }

    // Validações básicas
    const cleanTitle = title ? title.trim() : '';
    if (!cleanTitle) {
      return { success: false, error: 'O título é obrigatório.' };
    }
    if (cleanTitle.length > 255) {
      return { success: false, error: 'O título deve ter no máximo 255 caracteres.' };
    }

    const cleanDesc = description ? description.trim() : '';
    if (cleanDesc.length > 1000) {
      return { success: false, error: 'A descrição deve ter no máximo 1000 caracteres.' };
    }

    const cleanDifficulty = difficulty || 'MEDIUM';
    if (!ALLOWED_DIFFICULTIES.includes(cleanDifficulty)) {
      return { success: false, error: 'Dificuldade inválida.' };
    }

    const cleanPriority = priority || 'MEDIUM';
    if (!ALLOWED_PRIORITIES.includes(cleanPriority)) {
      return { success: false, error: 'Prioridade inválida.' };
    }

    let progressVal = 0;
    if (progressInput) {
      progressVal = parseInt(progressInput, 10);
      if (isNaN(progressVal) || progressVal < 0 || progressVal > 100) {
        return { success: false, error: 'O progresso deve ser um valor entre 0 e 100.' };
      }
    }

    let cleanDueDate: string | null = null;
    if (dueDateInput && dueDateInput.trim()) {
      const trimmed = dueDateInput.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return { success: false, error: 'Prazo inválido.' };
      }
      cleanDueDate = trimmed;
    }

    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada.' };
    }

    // Buscar a tarefa original para revalidação de área
    const { data: originalTask, error: getTaskError } = await supabase
      .from('tasks')
      .select('life_area_id, status')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (getTaskError || !originalTask) {
      return { success: false, error: 'Tarefa não encontrada ou já deletada.' };
    }

    // Não permitir editar se estiver concluída ou podada via formulário comum
    if (originalTask.status !== 'ACTIVE') {
      return { success: false, error: 'Apenas tarefas ativas podem ser modificadas.' };
    }

    // Atualização da tarefa
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        title: cleanTitle,
        description: cleanDesc || null,
        difficulty: cleanDifficulty,
        priority: cleanPriority,
        progress: progressVal,
        due_date: cleanDueDate,
      })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Erro de banco ao atualizar tarefa:', updateError);
      return { success: false, error: 'Erro no servidor ao salvar alterações.' };
    }

    // Revalidar caminhos
    revalidatePath('/garden');
    revalidatePath(`/garden/${originalTask.life_area_id}`);
    revalidatePath('/statistics');

    return { success: true, message: 'Tarefa atualizada!' };
  } catch (err) {
    console.error('Erro ao editar tarefa:', err);
    return { success: false, error: 'Erro inesperado ao salvar alterações.' };
  }
}

/**
 * Conclui uma tarefa com status 'COMPLETED', completed_at e progress 100.
 */
export async function completeTaskAction(taskId: string): Promise<ActionState> {
  try {
    if (!taskId) {
      return { success: false, error: 'Tarefa inválida.' };
    }

    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada.' };
    }

    // Buscar dados da tarefa para saber qual área de vida revalidar
    const { data: task, error: getError } = await supabase
      .from('tasks')
      .select('life_area_id')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (getError || !task) {
      return { success: false, error: 'Tarefa não encontrada.' };
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        progress: 100,
        prune_reason: null, // Limpa qualquer poda se concluído
      })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Erro de banco ao concluir tarefa:', updateError);
      return { success: false, error: 'Falha no servidor ao concluir tarefa.' };
    }

    // Revalidar rotas
    revalidatePath('/garden');
    revalidatePath(`/garden/${task.life_area_id}`);
    revalidatePath('/greenhouse');
    revalidatePath('/statistics');

    return { success: true, message: 'Tarefa concluída com sucesso!' };
  } catch (err) {
    console.error('Erro ao concluir tarefa:', err);
    return { success: false, error: 'Erro inesperado ao concluir tarefa.' };
  }
}

/**
 * Poda uma tarefa (status 'PRUNED' com justificativa de poda obrigatória).
 */
export async function pruneTaskAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const taskId = formData.get('task_id')?.toString();
    const reason = formData.get('prune_reason')?.toString();

    if (!taskId) {
      return { success: false, error: 'Identificador de tarefa inválido.' };
    }

    const cleanReason = reason ? reason.trim() : '';
    if (!cleanReason) {
      return { success: false, error: 'A justificativa de poda é obrigatória.' };
    }
    if (cleanReason.length > 500) {
      return { success: false, error: 'A justificativa deve ter no máximo 500 caracteres.' };
    }

    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada.' };
    }

    const { data: task, error: getError } = await supabase
      .from('tasks')
      .select('life_area_id')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (getError || !task) {
      return { success: false, error: 'Tarefa não encontrada ou já deletada.' };
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'PRUNED',
        prune_reason: cleanReason,
        completed_at: null, // Limpa conclusão ao podar
      })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Erro ao podar tarefa:', updateError);
      return { success: false, error: 'Erro no servidor ao podar a tarefa.' };
    }

    // Revalidar rotas
    revalidatePath('/garden');
    revalidatePath(`/garden/${task.life_area_id}`);
    revalidatePath('/greenhouse');
    revalidatePath('/statistics');

    return { success: true, message: 'Tarefa podada com sucesso.' };
  } catch (err) {
    console.error('Erro na action pruneTaskAction:', err);
    return { success: false, error: 'Erro inesperado ao podar.' };
  }
}

/**
 * Executa soft delete completo em uma tarefa (deleted_at = now()).
 */
export async function deleteTaskAction(taskId: string): Promise<ActionState> {
  try {
    if (!taskId) {
      return { success: false, error: 'Tarefa inválida.' };
    }

    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada.' };
    }

    const { data: task, error: getError } = await supabase
      .from('tasks')
      .select('life_area_id')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (getError || !task) {
      return { success: false, error: 'Tarefa não encontrada ou já deletada.' };
    }

    const { error: deleteError } = await supabase
      .from('tasks')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Erro ao deletar tarefa:', deleteError);
      return { success: false, error: 'Erro ao remover a tarefa.' };
    }

    // Revalidar rotas
    revalidatePath('/garden');
    revalidatePath(`/garden/${task.life_area_id}`);
    revalidatePath('/greenhouse');
    revalidatePath('/statistics');

    return { success: true, message: 'Tarefa removida com sucesso.' };
  } catch (err) {
    console.error('Erro ao deletar tarefa:', err);
    return { success: false, error: 'Erro inesperado ao deletar.' };
  }
}
