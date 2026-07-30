import React from 'react';
import { PlantStage, PlantVisualSize, HealthStatus } from '../../domain/growth/types';

interface PlantVisualProps {
  stage: PlantStage;
  visualSize: PlantVisualSize;
  healthStatus?: HealthStatus;
  label?: string;
  animated?: boolean;
  className?: string;
}

export const PlantVisual: React.FC<PlantVisualProps> = ({
  stage,
  visualSize,
  healthStatus = 'HEALTHY',
  label,
  animated = true,
  className = '',
}) => {
  // Define o tamanho do container baseado no visualSize controlado
  const sizeClasses = {
    SMALL: 'w-20 h-20',
    MEDIUM: 'w-28 h-28',
    LARGE: 'w-36 h-36',
  };

  const currentSizeClass = sizeClasses[visualSize] || sizeClasses.MEDIUM;

  // Renderiza o SVG específico do estágio
  const renderSVG = () => {
    const animationClass = animated ? 'animate-sway motion-reduce:animate-none' : '';

    switch (stage) {
      case 'SEED':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Solo / Terra */}
            <ellipse cx="50" cy="85" rx="35" ry="8" fill="#5c4033" opacity="0.8" />
            <ellipse cx="50" cy="83" rx="28" ry="6" fill="#3d2a1d" />
            
            {/* Semente */}
            <g className={animationClass} style={{ transformOrigin: '50px 80px' }}>
              <path
                d="M50 68 C44 73, 45 80, 50 82 C55 80, 56 73, 50 68 Z"
                fill="#d2b48c"
                stroke="#8b5a2b"
                strokeWidth="1.5"
              />
              <path d="M49 71 Q47 76, 50 80" stroke="#8b5a2b" strokeWidth="1" fill="none" />
            </g>
          </svg>
        );

      case 'SPROUT':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Solo */}
            <ellipse cx="50" cy="85" rx="38" ry="10" fill="#5c4033" opacity="0.8" />
            <ellipse cx="50" cy="83" rx="30" ry="7" fill="#3d2a1d" />
            
            <g className={animationClass} style={{ transformOrigin: '50px 83px' }}>
              {/* Caule */}
              <path
                d="M50 83 Q47 65, 52 50"
                stroke="#4ade80"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              {/* Folha pequena */}
              <path
                d="M51 51 Q58 45, 63 48 Q62 55, 51 51"
                fill="#22c55e"
                stroke="#15803d"
                strokeWidth="1"
              />
              {/* Pequeno broto lateral */}
              <path
                d="M48 65 Q42 60, 39 63 Q42 67, 49 65"
                fill="#4ade80"
                stroke="#15803d"
                strokeWidth="1"
              />
            </g>
          </svg>
        );

      case 'SAPLING':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Solo */}
            <ellipse cx="50" cy="85" rx="40" ry="10" fill="#5c4033" opacity="0.8" />
            <ellipse cx="50" cy="83" rx="32" ry="7" fill="#3d2a1d" />
            
            <g className={animationClass} style={{ transformOrigin: '50px 83px' }}>
              {/* Caule principal mais grosso */}
              <path
                d="M50 83 Q46 55, 50 35"
                stroke="#8b5a2b"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M50 83 Q46 55, 50 35"
                stroke="#4ade80"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.3"
              />
              {/* Galho esquerdo */}
              <path
                d="M48 60 Q38 52, 32 54"
                stroke="#8b5a2b"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              {/* Folhas */}
              <path
                d="M32 54 Q25 46, 26 53 Q30 58, 32 54"
                fill="#22c55e"
                stroke="#15803d"
                strokeWidth="1"
              />
              <path
                d="M50 35 Q58 24, 62 28 Q58 36, 50 35"
                fill="#22c55e"
                stroke="#15803d"
                strokeWidth="1"
              />
              <path
                d="M50 45 Q38 38, 42 32 Q48 38, 50 45"
                fill="#4ade80"
                stroke="#15803d"
                strokeWidth="1"
              />
            </g>
          </svg>
        );

      case 'TREE':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Solo */}
            <ellipse cx="50" cy="85" rx="42" ry="11" fill="#5c4033" opacity="0.8" />
            <ellipse cx="50" cy="83" rx="34" ry="8" fill="#3d2a1d" />
            
            <g className={animationClass} style={{ transformOrigin: '50px 83px' }}>
              {/* Tronco */}
              <path
                d="M50 83 C46 65, 43 50, 50 25"
                stroke="#78350f"
                strokeWidth="6.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Galhos secundários */}
              <path
                d="M47 52 Q35 40, 28 42"
                stroke="#78350f"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M51 45 Q65 35, 72 38"
                stroke="#78350f"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              
              {/* Copa de Folhas / Copa Principal */}
              <circle cx="50" cy="22" r="14" fill="#15803d" />
              <circle cx="38" cy="30" r="12" fill="#166534" />
              <circle cx="62" cy="28" r="13" fill="#22c55e" />
              <circle cx="28" cy="42" r="8" fill="#4ade80" />
              <circle cx="72" cy="38" r="9" fill="#15803d" />
            </g>
          </svg>
        );

      case 'STRONG':
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Solo rico */}
            <ellipse cx="50" cy="85" rx="44" ry="12" fill="#5c4033" opacity="0.9" />
            <ellipse cx="50" cy="83" rx="36" ry="9" fill="#271a11" />

            <g className={animationClass} style={{ transformOrigin: '50px 83px' }}>
              {/* Tronco robusto */}
              <path
                d="M50 83 C45 60, 42 45, 50 20"
                stroke="#451a03"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M46 55 Q30 38, 22 42"
                stroke="#451a03"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M52 48 Q70 30, 78 35"
                stroke="#451a03"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Copas detalhadas em camadas de verde */}
              <circle cx="50" cy="18" r="16" fill="#14532d" />
              <circle cx="36" cy="28" r="14" fill="#15803d" />
              <circle cx="64" cy="26" r="15" fill="#22c55e" />
              <circle cx="22" cy="42" r="10" fill="#4ade80" />
              <circle cx="78" cy="35" r="11" fill="#166534" />

              {/* Pequenas flores brancas florescendo */}
              <circle cx="48" cy="14" r="2.2" fill="#ffffff" />
              <circle cx="38" cy="24" r="2.2" fill="#ffffff" />
              <circle cx="60" cy="20" r="2.2" fill="#ffffff" />
              <circle cx="68" cy="30" r="2.2" fill="#ffffff" />
              <circle cx="32" cy="34" r="2.2" fill="#ffffff" />
            </g>
          </svg>
        );

      case 'MAJESTIC':
      case 'MATURE': // Suporte retrocompatível
        return (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Solo rico */}
            <ellipse cx="50" cy="85" rx="44" ry="12" fill="#5c4033" opacity="0.9" />
            <ellipse cx="50" cy="83" rx="36" ry="9" fill="#271a11" />

            <g className={animationClass} style={{ transformOrigin: '50px 83px' }}>
              {/* Tronco robusto */}
              <path
                d="M50 83 C45 60, 42 45, 50 20"
                stroke="#451a03"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M46 55 Q30 38, 22 42"
                stroke="#451a03"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M52 48 Q70 30, 78 35"
                stroke="#451a03"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Copas detalhadas em camadas de verde */}
              <circle cx="50" cy="18" r="16" fill="#14532d" />
              <circle cx="36" cy="28" r="14" fill="#15803d" />
              <circle cx="64" cy="26" r="15" fill="#22c55e" />
              <circle cx="22" cy="42" r="10" fill="#4ade80" />
              <circle cx="78" cy="35" r="11" fill="#166534" />

              {/* Frutos/Flores de Sucesso (Círculos vermelhos/dourados pequenos) */}
              <circle cx="48" cy="14" r="2.5" fill="#f59e0b" />
              <circle cx="38" cy="24" r="2.5" fill="#ef4444" />
              <circle cx="60" cy="20" r="2.5" fill="#f59e0b" />
              <circle cx="68" cy="30" r="2.5" fill="#ef4444" />
              <circle cx="32" cy="34" r="2.5" fill="#f59e0b" />
              <circle cx="24" cy="40" r="2" fill="#ef4444" />
            </g>
          </svg>
        );

      default:
        return null;
    }
  };

  const defaultLabel = `${stage} (${visualSize})`;

  const filterClasses = {
    HEALTHY: 'brightness-110 saturate-[1.25]',
    REGULAR: 'filter-none',
    IDLE: 'saturate-[0.5] sepia-[0.2] brightness-[0.95]',
    WITHERED: 'grayscale-[0.8] opacity-80 contrast-[0.9]',
  };

  const currentFilterClass = filterClasses[healthStatus] || '';

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="img"
      aria-label={label || defaultLabel}
    >
      <div className={`relative transition-all duration-300 ${currentSizeClass} ${currentFilterClass}`}>
        {renderSVG()}
      </div>
    </div>
  );
};
