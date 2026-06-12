'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems, NavigationItem } from '../../config/navigation';
import { RenderNavigationIcon } from './Sidebar';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-emerald-950 text-emerald-100 border-t border-emerald-900 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navigationItems.map((item: NavigationItem) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-150 ${
                isActive ? 'text-white' : 'text-emerald-400 hover:text-emerald-200'
              }`}
            >
              <RenderNavigationIcon type={item.iconType} className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
