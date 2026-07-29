export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  iconType: 'garden' | 'plant' | 'focus' | 'greenhouse' | 'statistics' | 'settings' | 'calendar';
}

export const navigationItems: NavigationItem[] = [
  {
    id: 'garden',
    label: 'Meu Jardim',
    href: '/garden',
    iconType: 'garden',
  },

  {
    id: 'focus',
    label: 'Foco',
    href: '/focus',
    iconType: 'focus',
  },
  {
    id: 'calendar',
    label: 'Agenda',
    href: '/calendar',
    iconType: 'calendar',
  },
  {
    id: 'greenhouse',
    label: 'Estufa',
    href: '/greenhouse',
    iconType: 'greenhouse',
  },
  {
    id: 'statistics',
    label: 'Estatísticas',
    href: '/statistics',
    iconType: 'statistics',
  },
  {
    id: 'settings',
    label: 'Configurações',
    href: '/settings',
    iconType: 'settings',
  },
];
