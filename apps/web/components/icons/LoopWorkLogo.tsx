import React from 'react';

interface LoopWorkLogoProps {
  variant?: 'full' | 'icon-only';
  mode?: 'dark' | 'light' | 'mono-white' | 'mono-black';
  className?: string;
  size?: number; // Icon size (default 34)
}

export const LoopWorkNodeIcon: React.FC<{ mode?: 'dark' | 'light' | 'mono-white' | 'mono-black'; size?: number }> = ({
  mode = 'dark',
  size = 34,
}) => {
  // Determine colors based on mode
  let nodeColor = '#2E8FA3';
  let connectorColor = '#5C666D';

  if (mode === 'light') {
    nodeColor = '#2E8FA3';
    connectorColor = '#6B7378';
  } else if (mode === 'mono-white') {
    nodeColor = '#FFFFFF';
    connectorColor = '#FFFFFF';
  } else if (mode === 'mono-black') {
    nodeColor = '#000000';
    connectorColor = '#000000';
  }

  const connectorOpacity = mode === 'mono-white' ? 0.4 : mode === 'mono-black' ? 0.4 : 0.85;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Connector lines connecting node centers: (9,9), (25,9), (17,25) */}
      <g stroke={connectorColor} strokeWidth="1.4" strokeLinecap="round" strokeOpacity={connectorOpacity}>
        <line x1="9" y1="9" x2="25" y2="9" />
        <line x1="25" y1="9" x2="17" y2="25" />
        <line x1="17" y1="25" x2="9" y2="9" />
      </g>

      {/* Primary Node (Top-Left) - 100% opacity */}
      <circle cx="9" cy="9" r="4" fill={nodeColor} fillOpacity="1.0" />

      {/* Secondary Node (Top-Right) - 55% opacity */}
      <circle cx="25" cy="9" r="4" fill={nodeColor} fillOpacity="0.55" />

      {/* Tertiary Node (Bottom-Center) - 80% opacity */}
      <circle cx="17" cy="25" r="4" fill={nodeColor} fillOpacity="0.8" />
    </svg>
  );
};

export const LoopWorkLogo: React.FC<LoopWorkLogoProps> = ({
  variant = 'full',
  mode = 'dark',
  className = '',
  size = 34,
}) => {
  let textColor = '#EDEEF0';
  if (mode === 'light') textColor = '#181B15';
  if (mode === 'mono-white') textColor = '#FFFFFF';
  if (mode === 'mono-black') textColor = '#000000';

  if (variant === 'icon-only') {
    let containerBg = '#14171A';
    let containerBorder = '#262B31';
    if (mode === 'light') {
      containerBg = '#F0F1EE';
      containerBorder = '#D0D4CC';
    } else if (mode === 'mono-white') {
      containerBg = 'transparent';
      containerBorder = '#FFFFFF';
    } else if (mode === 'mono-black') {
      containerBg = 'transparent';
      containerBorder = '#000000';
    }

    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl p-1.5 ${className}`}
        style={{
          backgroundColor: containerBg,
          border: `1px solid ${containerBorder}`,
          width: size + 12,
          height: size + 12,
        }}
      >
        <LoopWorkNodeIcon mode={mode} size={size} />
      </div>
    );
  }

  const fontSize = `${Math.max(22, Math.round(size * 0.68))}px`;

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      <LoopWorkNodeIcon mode={mode} size={size} />
      <span
        style={{
          color: textColor,
          fontWeight: 500,
          fontSize: fontSize,
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-sans), Inter, system-ui, sans-serif',
        }}
      >
        LoopWork
      </span>
    </div>
  );
};
