import React, { useState, useEffect } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showParent?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showParent = false,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  }[size];

  const textStyles = {
    sm: 'text-base font-bold tracking-tight',
    md: 'text-lg font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
    xl: 'text-3xl font-black tracking-tight'
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Beldi AI Emblem / Logo Image */}
      <div className={`relative ${iconDimensions} shrink-0 flex items-center justify-center`}>
        {!imgError ? (
          <img
            src="/logo.png"
            alt="Beldi AI Logo"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain drop-shadow-md rounded-lg"
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-md"
          >
            <defs>
              <linearGradient id="beldiGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818CF8" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#4338CA" />
              </linearGradient>
              <linearGradient id="beldiGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="beldiCore" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#C7D2FE" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
              <filter id="beldiGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Exterior Shield / Hex Geometry */}
            <polygon
              points="50,6 90,28 90,72 50,94 10,72 10,28"
              stroke="url(#beldiGrad1)"
              strokeWidth="2.5"
              strokeOpacity="0.4"
              fill="#0D0E15"
              fillOpacity="0.9"
            />

            {/* Intersecting Beldi 'B' / Neural Wave loops */}
            <path
              d="M 30 24 L 54 24 C 66 24 74 32 74 42 C 74 48 70 53 64 56 C 72 59 76 66 76 74 C 76 84 66 90 52 90 L 30 90 Z"
              stroke="url(#beldiGrad1)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.2"
            />

            {/* Dynamic Stylized Inner Wings */}
            <path
              d="M 32 26 C 48 26 68 34 68 48 C 68 58 54 64 42 64 L 32 64 Z"
              fill="url(#beldiGrad1)"
            />
            <path
              d="M 32 54 C 48 54 72 60 72 74 C 72 86 52 88 32 88 Z"
              fill="url(#beldiGrad2)"
            />

            {/* Central Bright Energy Core */}
            <circle
              cx="48"
              cy="52"
              r="7"
              fill="url(#beldiCore)"
              filter="url(#beldiGlow)"
            />

            {/* Quantum node points */}
            <circle cx="50" cy="14" r="2.5" fill="#38BDF8" />
            <circle cx="86" cy="34" r="2" fill="#818CF8" />
            <circle cx="86" cy="66" r="2" fill="#A855F7" />
            <circle cx="50" cy="86" r="2.5" fill="#6366F1" />
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center tracking-tight">
            <span className={`text-white font-bold ${textStyles}`}>
              Beldi<span className="text-indigo-400 ml-1 font-extrabold">AI</span>
            </span>
          </div>
          {showParent && (
            <span className="text-[10px] font-medium text-[#71717A] tracking-wider -mt-0.5">
              by Build X
            </span>
          )}
        </div>
      )}
    </div>
  );
};
