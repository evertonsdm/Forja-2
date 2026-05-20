import React, { useMemo } from "react";
import { cyrb128, mulberry32 } from "../utils/prng";

interface NPCAvatarProps {
  seed: string;
  size?: number;
}

export const NPCAvatar: React.FC<NPCAvatarProps> = ({ seed, size = 120 }) => {
  const avatarData = useMemo(() => {
    const hash = cyrb128(seed);
    const rand = mulberry32(hash[1] || 999);

    // Color palettes (Aesthetic tech hues)
    const backgrounds = [
      "#0f172a", // Slate 900
      "#1e1b4b", // Indigo 950
      "#180828", // Deep Violet
      "#022c22", // Emerald 950
      "#1c1917", // Stone 900
      "#0c0a09"  // Warm Black
    ];

    const accents = [
      "#f59e0b", // Amber
      "#3b82f6", // Blue
      "#ec4899", // Pink
      "#10b981", // Emerald
      "#a855f7", // Purple
      "#ef4444"  // Red
    ];

    const shapes = ["circle", "triangle", "diamond", "hexagon", "cross"];

    const bg = backgrounds[Math.floor(rand() * backgrounds.length)];
    const primaryColor = accents[Math.floor(rand() * accents.length)];
    let secondaryColor = accents[Math.floor(rand() * accents.length)];
    while (secondaryColor === primaryColor) {
      secondaryColor = accents[Math.floor(rand() * accents.length)];
    }

    const shape1 = shapes[Math.floor(rand() * shapes.length)];
    const shape2 = shapes[Math.floor(rand() * shapes.length)];
    
    const size1 = Math.floor(rand() * 25) + 20; // 20 - 45
    const size2 = Math.floor(rand() * 15) + 10; // 10 - 25
    
    const posX1 = Math.floor(rand() * 20) + 40; // 40 - 60
    const posY1 = Math.floor(rand() * 20) + 40; // 40 - 60
    
    const stripesCount = Math.floor(rand() * 5) + 3; // 3 - 7
    const rotate = Math.floor(rand() * 360);

    return {
      bg,
      primaryColor,
      secondaryColor,
      shape1,
      shape2,
      size1,
      size2,
      posX1,
      posY1,
      stripesCount,
      rotate
    };
  }, [seed]);

  const renderShape = (shape: string, color: string, sizePct: number, x: number, y: number) => {
    switch (shape) {
      case "circle":
        return <circle cx={x} cy={y} r={sizePct} fill={color} opacity="0.85" />;
      case "triangle":
        const p1 = `${x},${y - sizePct}`;
        const p2 = `${x - sizePct},${y + sizePct}`;
        const p3 = `${x + sizePct},${y + sizePct}`;
        return <polygon points={`${p1} ${p2} ${p3}`} fill={color} opacity="0.85" />;
      case "diamond":
        const dp1 = `${x},${y - sizePct}`;
        const dp2 = `${x + sizePct},${y}`;
        const dp3 = `${x},${y + sizePct}`;
        const dp4 = `${x - sizePct},${y}`;
        return <polygon points={`${dp1} ${dp2} ${dp3} ${dp4}`} fill={color} opacity="0.85" />;
      case "hexagon":
        const points = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          points.push(`${x + sizePct * Math.cos(angle)},${y + sizePct * Math.sin(angle)}`);
        }
        return <polygon points={points.join(" ")} fill={color} opacity="0.85" />;
      case "cross":
        const w = sizePct * 0.4;
        const h = sizePct;
        return (
          <g fill={color} opacity="0.85">
            <rect x={x - w / 2} y={y - h} width={w} height={h * 2} rx="2" />
            <rect x={x - h} y={y - w / 2} width={h * 2} height={w} rx="2" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="relative overflow-hidden rounded-xl border-2 border-slate-700/80 shadow-md group"
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full transform transition-transform duration-500 group-hover:scale-110"
      >
        {/* Background */}
        <rect width="100" height="100" fill={avatarData.bg} />

        {/* Matrix Technical Grids */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Dynamic scanlines / stripes in back */}
        <g opacity="0.15">
          {Array.from({ length: avatarData.stripesCount }).map((_, i) => (
            <line
              key={i}
              x1="0"
              y1={i * (100 / avatarData.stripesCount)}
              x2="100"
              y2={i * (100 / avatarData.stripesCount)}
              stroke={avatarData.secondaryColor}
              strokeWidth="1.5"
            />
          ))}
        </g>

        {/* Deterministic geometric configuration */}
        <g transform={`rotate(${avatarData.rotate}, 50, 50)`}>
          {renderShape(avatarData.shape1, avatarData.primaryColor, avatarData.size1, avatarData.posX1, avatarData.posY1)}
          {renderShape(avatarData.shape2, avatarData.secondaryColor, avatarData.size2, 50, 50)}
        </g>

        {/* HUD Frame Accents */}
        <rect x="5" y="5" width="90" height="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <path d="M 5 15 L 5 5 L 15 5" fill="none" stroke={avatarData.primaryColor} strokeWidth="1.5" />
        <path d="M 85 5 L 95 5 L 95 15" fill="none" stroke={avatarData.primaryColor} strokeWidth="1.5" />
        <path d="M 5 85 L 5 95 L 15 95" fill="none" stroke={avatarData.primaryColor} strokeWidth="1.5" />
        <path d="M 85 95 L 95 95 L 95 85" fill="none" stroke={avatarData.primaryColor} strokeWidth="1.5" />
      </svg>
    </div>
  );
};
