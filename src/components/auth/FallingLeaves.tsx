import React from 'react';

const leaves = [
  { left: '8%', delay: '0s', duration: '14s', rotate: '12deg', scale: '0.8' },
  { left: '18%', delay: '2s', duration: '16s', rotate: '-8deg', scale: '1' },
  { left: '31%', delay: '4s', duration: '13s', rotate: '16deg', scale: '0.9' },
  { left: '44%', delay: '1s', duration: '15s', rotate: '-14deg', scale: '1.1' },
  { left: '57%', delay: '3s', duration: '17s', rotate: '10deg', scale: '0.75' },
  { left: '69%', delay: '5s', duration: '14s', rotate: '-18deg', scale: '1' },
  { left: '78%', delay: '2.5s', duration: '16s', rotate: '20deg', scale: '0.85' },
  { left: '88%', delay: '4.5s', duration: '15s', rotate: '-10deg', scale: '1.2' },
  { left: '95%', delay: '1.5s', duration: '18s', rotate: '14deg', scale: '0.7' },
  { left: '24%', delay: '6s', duration: '19s', rotate: '-16deg', scale: '0.95' },
];

export function FallingLeaves() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        .falling-leaf {
          position: absolute;
          top: -40px;
          display: block;
          animation-name: fallAnimation;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          opacity: 0;
        }

        @keyframes fallAnimation {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.35;
          }
          90% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(105vh) rotate(360deg) translateX(100px);
            opacity: 0;
          }
        }

        /* Respeita a acessibilidade dos usuários */
        @media (prefers-reduced-motion: reduce) {
          .falling-leaf {
            animation: none !important;
            display: none !important;
          }
        }
      `}</style>
      {leaves.map((leaf, index) => (
        <svg
          key={index}
          className="falling-leaf"
          style={{
            left: leaf.left,
            animationDelay: leaf.delay,
            animationDuration: leaf.duration,
            transform: `rotate(${leaf.rotate}) scale(${leaf.scale})`,
            width: '20px',
            height: '20px',
          }}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 22C6 18 12 17 17 12C22 7 21 2 21 2C21 2 16 3 11 8C6 13 5 19 2 22Z"
            fill="#059669"
            opacity="0.3"
          />
          <path
            d="M2 22C4.5 19.5 8 18 12.5 15.5"
            stroke="#047857"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      ))}
    </div>
  );
}
