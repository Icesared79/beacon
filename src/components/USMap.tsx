'use client';

import { useState } from 'react';

interface Office {
  city: string;
  state: string;
  lat: number;
  lng: number;
  prospects?: number;
}

interface USMapProps {
  offices: Office[];
  onOfficeClick?: (office: Office) => void;
}

// Simplified US state outlines — major states as simplified polygons
// Using an Albers equal-area projection approximation (scaled to 800x500 viewBox)
function projectPoint(lat: number, lng: number): [number, number] {
  // Simple Mercator-like projection scaled to viewBox
  const x = ((lng + 125) / 62) * 800;
  const y = ((50 - lat) / 26) * 500;
  return [x, y];
}

// US state boundaries as simplified paths (major outlines only)
const US_OUTLINE = `M 60 180 L 65 170 L 80 155 L 120 140 L 160 125 L 200 115 L 250 108 L 300 105 L 350 100 L 400 95 L 440 92 L 480 95 L 520 100 L 560 105 L 600 115 L 640 130 L 670 150 L 695 170 L 710 195 L 720 220 L 725 250 L 720 280 L 710 310 L 695 335 L 670 355 L 640 370 L 600 380 L 560 385 L 520 388 L 480 390 L 440 388 L 400 385 L 360 388 L 320 392 L 280 395 L 240 392 L 200 385 L 170 375 L 145 360 L 125 345 L 108 328 L 95 305 L 80 280 L 70 255 L 62 230 L 58 205 Z`;

export function USMap({ offices, onOfficeClick }: USMapProps) {
  const [hoveredOffice, setHoveredOffice] = useState<Office | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  return (
    <div className="relative w-full" style={{ paddingBottom: '55%' }}>
      <svg
        viewBox="0 0 800 500"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="800" height="500" fill="#F8FAFC" rx="8" />

        {/* Subtle grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="800" height="500" fill="url(#grid)" opacity="0.5" />

        {/* US outline */}
        <path
          d={US_OUTLINE}
          fill="#EBF2FB"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />

        {/* Connection lines from offices to center */}
        {offices.map((office) => {
          const [cx, cy] = projectPoint(office.lat, office.lng);
          return (
            <line
              key={`line-${office.city}`}
              x1={400}
              y1={250}
              x2={cx}
              y2={cy}
              stroke="#1B5EA8"
              strokeWidth="0.3"
              opacity="0.15"
            />
          );
        })}

        {/* Office markers */}
        {offices.map((office) => {
          const [cx, cy] = projectPoint(office.lat, office.lng);
          const isHovered = hoveredOffice?.city === office.city;
          return (
            <g
              key={office.city}
              onClick={() => onOfficeClick?.(office)}
              onMouseEnter={(e) => {
                setHoveredOffice(office);
                setTooltipPos({ x: cx, y: cy });
              }}
              onMouseLeave={() => setHoveredOffice(null)}
              className="cursor-pointer"
            >
              {/* Pulse ring */}
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 14 : 10}
                fill="#1B5EA8"
                opacity={isHovered ? 0.12 : 0.08}
                className="transition-all duration-200"
              />
              {/* Outer circle */}
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 7 : 5.5}
                fill="#1B5EA8"
                opacity={0.9}
                className="transition-all duration-200"
              />
              {/* Inner dot */}
              <circle
                cx={cx}
                cy={cy}
                r={2}
                fill="#FFFFFF"
              />
            </g>
          );
        })}

        {/* Tooltip */}
        {hoveredOffice && (
          <g>
            <rect
              x={tooltipPos.x - 60}
              y={tooltipPos.y - 42}
              width={120}
              height={30}
              rx={6}
              fill="#0F172A"
              opacity={0.92}
            />
            <text
              x={tooltipPos.x}
              y={tooltipPos.y - 28}
              textAnchor="middle"
              fill="white"
              fontSize="11"
              fontWeight="600"
              fontFamily="DM Sans, system-ui"
            >
              {hoveredOffice.city}, {hoveredOffice.state}
            </text>
            {hoveredOffice.prospects !== undefined && (
              <text
                x={tooltipPos.x}
                y={tooltipPos.y - 16}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="9"
                fontFamily="DM Sans, system-ui"
              >
                {hoveredOffice.prospects.toLocaleString()} prospects
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
