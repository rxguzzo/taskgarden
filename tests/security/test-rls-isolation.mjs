import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Utilitário para carregar variáveis de ambiente do .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        env[key] = val;
      }
    });
  }

  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    userAEmail: env.TASKGARDEN_TEST_USER_A_EMAIL || process.env.TASKGARDEN_TEST_USER_A_EMAIL,
    userAPassword: env.TASKGARDEN_TEST_USER_A_PASSWORD || process.env.TASKGARDEN_TEST_USER_A_PASSWORD,
    userBEmail: env.TASKGARDEN_TEST_USER_B_EMAIL || process.env.TASKGARDEN_TEST_USER_B_EMAIL,
    userBPassword: env.TASKGARDEN_TEST_USER_B_PASSWORD || process.env.TASKGARDEN_TEST_USER_B_PASSWORD,
  };
}

async function runTests() {
  console.log('🛡️ Iniciando Testes de Isolamento RLS do Supabase...\n');

  const config = loadEnv();

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.error('❌ Erro: Variáveis do Supabase (NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ausentes.');
    process.exit(1);
  }

  // --- MODO 1: Smoke Test Anônimo ---
  console.log('=== MODO 1: Smoke Test Anônimo ===');
  const anonClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
  
  let smokeTestPassed = true;

  console.log('1. Verificando acesso anônimo à tabela life_areas...');
  const { data: areas, error: areasError } = await anonClient.from('life_areas').select('*');
  if (areasError || !areas || areas.length === 0) {
    console.log('   ✅ Passou: Cliente anônimo não conseguiu ler life_areas.');
  } else {
    console.error('   ❌ Falha de Segurança: Cliente anônimo conseguiu ler dados de life_areas!');
    smokeTestPassed = false;
  }

  console.log('2. Verificando acesso anônimo à tabela tasks...');
  const { data: tasks, error: tasksError } = await anonClient.from('tasks').select('*');
  if (tasksError || !tasks || tasks.length === 0) {
    console.log('   ✅ Passou: Cliente anônimo não conseguiu ler tasks.');
  } else {
    console.error('   ❌ Falha de Segurança: Cliente anônimo conseguiu ler dados de tasks!');
    smokeTestPassed = false;
  }

  if (smokeTestPassed) {
    console.log('▶️ Smoke test anônimo: passou\n');
  } else {
    console.error('▶️ Smoke test anônimo: FALHOU\n');
  }

  // --- MODO 2: Teste Real A vs B ---
  console.log('=== MODO 2: Teste Real A vs B ===');
  if (!config.userAEmail || !config.userAPassword || !config.userBEmail || !config.userBPassword) {
    console.log('▶️ Teste A vs B: pulado por ausência de credenciais.');
    console.log('Para rodar o teste completo de isolamento de usuários, defina no .env.local:');
    console.log('  TASKGARDEN_TEST_USER_A_EMAIL=usuario_a@teste.com');
    console.log('  TASKGARDEN_TEST_USER_A_PASSWORD=senha_secura');
    console.log('  TASKGARDEN_TEST_USER_B_EMAIL=usuario_b@teste.com');
    console.log('  TASKGARDEN_TEST_USER_B_PASSWORD=senha_secura\n');
    return;
  }

  // Clientes autenticados (usando apenas chaves públicas/anon, sem service_role)
  const clientA = createClient(config.supabaseUrl, config.supabaseAnonKey);
  const clientB = createClient(config.supabaseUrl, config.supabaseAnonKey);

  console.log('1. Autenticando Usuário A...');
  const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
    email: config.userAEmail,
    password: config.userAPassword,
  });
  if (errA) {
    console.error('❌ Erro ao autenticar Usuário A:', errA.message);
    process.exit(1);
  }
  const userAId = authA.user.id;
  console.log(`   Usuário A autenticado. ID: ${userAId}`);

  console.log('2. Autenticando Usuário B...');
  const { data: authB, error: errB } = await clientB.auth.signInWithPassword({
    email: config.userBEmail,
    password: config.userBPassword,
  });
  if (errB) {
    console.error('❌ Erro ao autenticar Usuário B:', errB.message);
    process.exit(1);
  }
  const userBId = authB.user.id;
  console.log(`   Usuário B autenticado. ID: ${userBId}`);

  console.log('\n3. Criando Área de Vida e Tarefa temporária como Usuário A...');
  const { data: newArea, error: createAreaError } = await clientA
    .from('life_areas')
    .insert({
      user_id: userAId,
      name: `Área Teste RLS ${Date.now()}`,
      color: 'emerald',
    })
    .select()
    .single();

  if (createAreaError) {
    console.error('❌ Falha ao criar Área de Vida temporária para Usuário A:', createAreaError.message);
    process.exit(1);
  }
  console.log(`   Área de Vida criada: ${newArea.id}`);

  const { data: newTask, error: createTaskError } = await clientA
    .from('tasks')
    .insert({
      user_id: userAId,
      life_area_id: newArea.id,
      title: 'Tarefa Secreta do Usuário A',
      status: 'ACTIVE',
    })
    .select()
    .single();

  if (createTaskError) {
    console.error('❌ Falha ao criar Tarefa temporária para Usuário A:', createTaskError.message);
    // Limpeza parcial
    await clientA.from('life_areas').update({ deleted_at: new Date() }).eq('id', newArea.id);
    process.exit(1);
  }
  console.log(`   Tarefa criada: ${newTask.id}`);

  console.log('\n4. Executando validação de isolamento com Usuário B...');
  let userBIsolationPassed = true;

  // A. Usuário B tenta ler Área do Usuário A
  console.log('   - Teste A: Usuário B tenta buscar a life_area de A por ID...');
  const { data: readAreaB, error: readAreaErrorB } = await clientB
    .from('life_areas')
    .select('*')
    .eq('id', newArea.id);
  
  if (readAreaErrorB || !readAreaB || readAreaB.length === 0) {
    console.log('     ✅ Passou: Usuário B não conseguiu visualizar a área do Usuário A.');
  } else {
    console.error('     ❌ FALHA DE SEGURANÇA: Usuário B conseguiu ler a área do Usuário A!');
    userBIsolationPassed = false;
  }

  // B. Usuário B tenta ler Tarefa do Usuário A
  console.log('   - Teste B: Usuário B tenta buscar a task de A por ID...');
  const { data: readTaskB, error: readTaskErrorB } = await clientB
    .from('tasks')
    .select('*')
    .eq('id', newTask.id);

  if (readTaskErrorB || !readTaskB || readTaskB.length === 0) {
    console.log('     ✅ Passou: Usuário B não conseguiu visualizar a tarefa do Usuário A.');
  } else {
    console.error('     ❌ FALHA DE SEGURANÇA: Usuário B conseguiu ler a tarefa do Usuário A!');
    userBIsolationPassed = false;
  }

  // C. Usuário B tenta atualizar Área do Usuário A
  console.log('   - Teste C: Usuário B tenta atualizar a life_area de A...');
  const { data: updateAreaB, error: updateAreaErrorB } = await clientB
    .from('life_areas')
    .update({ name: 'Hacked by User B' })
    .eq('id', newArea.id)
    .select();

  if (updateAreaErrorB || !updateAreaB || updateAreaB.length === 0) {
    console.log('     ✅ Passou: Usuário B não conseguiu alterar a área do Usuário A.');
  } else {
    console.error('     ❌ FALHA DE SEGURANÇA: Usuário B alterou a área do Usuário A!');
    userBIsolationPassed = false;
  }

  // D. Usuário B tenta atualizar Tarefa do Usuário A
  console.log('   - Teste D: Usuário B tenta atualizar a task de A...');
  const { data: updateTaskB, error: updateTaskErrorB } = await clientB
    .from('tasks')
    .update({ title: 'Hacked by User B' })
    .eq('id', newTask.id)
    .select();

  if (updateTaskErrorB || !updateTaskB || updateTaskB.length === 0) {
    console.log('     ✅ Passou: Usuário B não conseguiu atualizar a tarefa do Usuário A.');
  } else {
    console.error('     ❌ FALHA DE SEGURANÇA: Usuário B alterou a tarefa do Usuário A!');
    userBIsolationPassed = false;
  }

  // E. Usuário B tenta associar tarefa à Área do Usuário A
  console.log('   - Teste E: Usuário B tenta associar uma nova tarefa à Área de A...');
  const { error: insertCrossError } = await clientB
    .from('tasks')
    .insert({
      user_id: userBId,
      life_area_id: newArea.id,
      title: 'Tarefa Injetada pelo Usuário B',
    });

  if (insertCrossError) {
    console.log(`     ✅ Passou: Inserção cruzada rejeitada pelo banco.`);
  } else {
    console.error('     ❌ FALHA DE SEGURANÇA: Usuário B conseguiu associar tarefa à área do Usuário A!');
    userBIsolationPassed = false;
  }

  console.log('\n5. Executando limpeza de dados temporários com Usuário A...');
  // Limpeza via soft delete (atualização lógica)
  await clientA.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', newTask.id);
  await clientA.from('life_areas').update({ deleted_at: new Date().toISOString() }).eq('id', newArea.id);
  console.log('   Limpeza concluída.');

  if (userBIsolationPassed) {
    console.log('\n▶️ Teste A vs B: passou');
  } else {
    console.error('\n▶️ Teste A vs B: FALHOU');
  }
}

runTests().catch((err) => {
  console.error('Erro ao rodar testes:', err);
});
