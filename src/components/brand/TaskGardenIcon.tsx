import React from 'react';
import Image from 'next/image';

type TaskGardenIconProps = {
  size?: number;
  className?: string;
};

export function TaskGardenIcon({ size = 48, className = '' }: TaskGardenIconProps) {
  return (
    <Image
      src="/brand/taskgarden-icon.png"
      alt="TaskGarden Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
