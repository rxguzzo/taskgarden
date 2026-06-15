import { DemoLifeArea } from '../domain/growth/types';

export const demoLifeAreas: DemoLifeArea[] = [
  {
    id: 'trabalho',
    name: 'Trabalho',
    description: 'Demandas profissionais, desenvolvimento de sistemas e reuniões de equipe.',
    stage: 'MATURE',
    visualSize: 'LARGE',
    totalMinutes: 10800, // 180 horas dedicadas
    healthStatus: 'HEALTHY',
    lastActivityAt: '2026-06-15T13:00:00.000Z',
  },
  {
    id: 'estudos',
    name: 'Estudos',
    description: 'Aprendizado de novas tecnologias, cursos de extensão e leituras.',
    stage: 'TREE',
    visualSize: 'MEDIUM',
    totalMinutes: 4800, // 80 horas dedicadas
    healthStatus: 'IDLE',
    lastActivityAt: '2026-06-08T17:30:00.000Z',
  },
  {
    id: 'academia',
    name: 'Academia',
    description: 'Treinos de força, exercícios cardiovasculares e hábitos saudáveis.',
    stage: 'SAPLING',
    visualSize: 'MEDIUM',
    totalMinutes: 1500, // 25 horas dedicadas
    healthStatus: 'THIRSTY',
    lastActivityAt: '2026-06-10T10:00:00.000Z',
  },
  {
    id: 'igreja',
    name: 'Igreja',
    description: 'Voluntariado, participação comunitária e estudos de espiritualidade.',
    stage: 'SPROUT',
    visualSize: 'SMALL',
    totalMinutes: 120, // 2 horas dedicadas
    healthStatus: 'HEALTHY',
    lastActivityAt: '2026-06-14T21:30:00.000Z',
  },
  {
    id: 'projetos',
    name: 'Projetos',
    description: 'Desenvolvimento de ideias pessoais e side projects.',
    stage: 'TREE',
    visualSize: 'LARGE',
    totalMinutes: 7200, // 120 horas dedicadas
    healthStatus: 'OVERLOADED',
    lastActivityAt: '2026-06-15T12:00:00.000Z',
  },
  {
    id: 'pessoal',
    name: 'Vida Pessoal',
    description: 'Organização da casa, finanças pessoais e lazer.',
    stage: 'SEED',
    visualSize: 'SMALL',
    totalMinutes: 30, // 30 minutos dedicados
    healthStatus: 'IDLE',
    lastActivityAt: '2026-06-01T23:00:00.000Z',
  }
];
