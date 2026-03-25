'use client';

import { useState } from 'react';
import { formatNumber } from '@/lib/utils';

interface Office {
  city: string;
  state: string;
  lat: number;
  lng: number;
  prospects?: number;
  critical?: number;
  score?: number;
  address?: string;
}

interface StateData {
  abbr: string;
  name: string;
  col: number;
  row: number;
  score: number;
}

interface USMapProps {
  offices: Office[];
  stateScores?: Record<string, number>;
  onOfficeClick?: (office: Office) => void;
}

function getDistressColor(score: number): string {
  if (score >= 80) return '#DC2626';
  if (score >= 65) return '#D97706';
  if (score >= 50) return '#2563EB';
  if (score >= 30) return '#93C5FD';
  return '#E2E8F0';
}

function getDistressTextColor(score: number): string {
  if (score >= 50) return '#FFFFFF';
  if (score >= 30) return '#1E3A5F';
  return '#64748B';
}

// Geographic tile layout — states in correct relative positions
const STATE_GRID: Array<{ abbr: string; name: string; col: number; row: number }> = [
  // Row 0
  { abbr: 'AK', name: 'Alaska', col: 0, row: 0 },
  { abbr: 'ME', name: 'Maine', col: 10, row: 0 },
  // Row 1
  { abbr: 'WA', name: 'Washington', col: 1, row: 1 },
  { abbr: 'MT', name: 'Montana', col: 2, row: 1 },
  { abbr: 'ND', name: 'N. Dakota', col: 3, row: 1 },
  { abbr: 'MN', name: 'Minnesota', col: 4, row: 1 },
  { abbr: 'WI', name: 'Wisconsin', col: 5, row: 1 },
  { abbr: 'MI', name: 'Michigan', col: 7, row: 1 },
  { abbr: 'VT', name: 'Vermont', col: 9, row: 1 },
  { abbr: 'NH', name: 'N. Hampshire', col: 10, row: 1 },
  // Row 2
  { abbr: 'OR', name: 'Oregon', col: 1, row: 2 },
  { abbr: 'ID', name: 'Idaho', col: 2, row: 2 },
  { abbr: 'SD', name: 'S. Dakota', col: 3, row: 2 },
  { abbr: 'IA', name: 'Iowa', col: 4, row: 2 },
  { abbr: 'IL', name: 'Illinois', col: 5, row: 2 },
  { abbr: 'IN', name: 'Indiana', col: 6, row: 2 },
  { abbr: 'OH', name: 'Ohio', col: 7, row: 2 },
  { abbr: 'NY', name: 'New York', col: 8, row: 2 },
  { abbr: 'MA', name: 'Massachusetts', col: 9, row: 2 },
  { abbr: 'CT', name: 'Connecticut', col: 10, row: 2 },
  // Row 3
  { abbr: 'NV', name: 'Nevada', col: 1, row: 3 },
  { abbr: 'WY', name: 'Wyoming', col: 2, row: 3 },
  { abbr: 'NE', name: 'Nebraska', col: 3, row: 3 },
  { abbr: 'MO', name: 'Missouri', col: 4, row: 3 },
  { abbr: 'KY', name: 'Kentucky', col: 5, row: 3 },
  { abbr: 'WV', name: 'W. Virginia', col: 6, row: 3 },
  { abbr: 'PA', name: 'Pennsylvania', col: 7, row: 3 },
  { abbr: 'NJ', name: 'New Jersey', col: 8, row: 3 },
  { abbr: 'RI', name: 'Rhode Island', col: 9, row: 3 },
  // Row 4
  { abbr: 'CA', name: 'California', col: 0, row: 4 },
  { abbr: 'UT', name: 'Utah', col: 1, row: 4 },
  { abbr: 'CO', name: 'Colorado', col: 2, row: 4 },
  { abbr: 'KS', name: 'Kansas', col: 3, row: 4 },
  { abbr: 'AR', name: 'Arkansas', col: 4, row: 4 },
  { abbr: 'TN', name: 'Tennessee', col: 5, row: 4 },
  { abbr: 'VA', name: 'Virginia', col: 6, row: 4 },
  { abbr: 'MD', name: 'Maryland', col: 7, row: 4 },
  { abbr: 'DE', name: 'Delaware', col: 8, row: 4 },
  { abbr: 'DC', name: 'D.C.', col: 9, row: 4 },
  // Row 5
  { abbr: 'AZ', name: 'Arizona', col: 1, row: 5 },
  { abbr: 'NM', name: 'New Mexico', col: 2, row: 5 },
  { abbr: 'OK', name: 'Oklahoma', col: 3, row: 5 },
  { abbr: 'LA', name: 'Louisiana', col: 4, row: 5 },
  { abbr: 'MS', name: 'Mississippi', col: 5, row: 5 },
  { abbr: 'AL', name: 'Alabama', col: 6, row: 5 },
  { abbr: 'GA', name: 'Georgia', col: 7, row: 5 },
  { abbr: 'SC', name: 'S. Carolina', col: 8, row: 5 },
  { abbr: 'NC', name: 'N. Carolina', col: 9, row: 5 },
  // Row 6
  { abbr: 'HI', name: 'Hawaii', col: 0, row: 6 },
  { abbr: 'TX', name: 'Texas', col: 3, row: 6 },
  { abbr: 'FL', name: 'Florida', col: 7, row: 6 },
];

// Map state abbreviations to office locations
const STATE_TO_OFFICE: Record<string, string> = {
  'MA': 'Newton', 'AZ': 'Phoenix', 'CA': 'Los Angeles', 'CO': 'Denver',
  'FL': 'Miami', 'GA': 'Atlanta', 'IL': 'Chicago', 'LA': 'New Orleans',
  'MI': 'Detroit', 'NV': 'Las Vegas', 'NJ': 'Hoboken', 'NY': 'Brooklyn',
  'NC': 'Charlotte', 'OH': 'Columbus', 'PA': 'Philadelphia', 'TN': 'Memphis',
  'TX': 'Dallas', 'WA': 'Seattle', 'DC': 'Washington',
};

// Default state scores based on ACCC market data
const DEFAULT_STATE_SCORES: Record<string, number> = {
  'IL': 81, 'CA': 75, 'GA': 74, 'CO': 71, 'PA': 78, 'TX': 70, 'FL': 72,
  'MI': 72, 'MA': 68, 'AZ': 67, 'NC': 65, 'WA': 63, 'OH': 66, 'NV': 60,
  'NJ': 58, 'NY': 62, 'LA': 55, 'TN': 52, 'DC': 48, 'MD': 45, 'VA': 42,
  'IN': 38, 'MO': 35, 'KY': 32, 'SC': 40, 'AL': 36, 'MS': 34,
};

export function USMap({ offices, stateScores, onOfficeClick }: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [hoveredOffice, setHoveredOffice] = useState<Office | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const scores = stateScores || DEFAULT_STATE_SCORES;

  const TILE_W = 66;
  const TILE_H = 52;
  const GAP = 3;
  const PAD_X = 10;
  const PAD_Y = 10;
  const LEGEND_H = 40;
  const totalW = PAD_X * 2 + 11 * (TILE_W + GAP);
  const gridH = PAD_Y * 2 + 7 * (TILE_H + GAP);
  const totalH = gridH + LEGEND_H;

  // Project lat/lng to SVG coordinates for office dots
  function projectPoint(lat: number, lng: number): [number, number] {
    const x = ((lng + 125) / 62) * totalW;
    const y = ((50 - lat) / 28) * totalH;
    return [x, y];
  }

  // Check if a state has an ACCC office
  function hasOffice(abbr: string): boolean {
    return abbr in STATE_TO_OFFICE;
  }

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width={totalW} height={totalH} fill="#F8FAFC" rx="8" />

        {/* State tiles */}
        {STATE_GRID.map((state) => {
          const x = PAD_X + state.col * (TILE_W + GAP);
          const y = PAD_Y + state.row * (TILE_H + GAP);
          const score = scores[state.abbr] || 0;
          const fillColor = getDistressColor(score);
          const textColor = getDistressTextColor(score);
          const isHovered = hoveredState === state.abbr;
          const isACCC = hasOffice(state.abbr);

          return (
            <g
              key={state.abbr}
              onMouseEnter={() => setHoveredState(state.abbr)}
              onMouseLeave={() => setHoveredState(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={TILE_W}
                height={TILE_H}
                rx={4}
                fill={fillColor}
                opacity={isHovered ? 1 : 0.88}
                stroke={isHovered ? '#0F172A' : (isACCC ? '#1B5EA8' : 'transparent')}
                strokeWidth={isHovered ? 2 : (isACCC ? 1.5 : 0)}
                className="transition-all duration-150"
              />
              {/* State abbreviation */}
              <text
                x={x + TILE_W / 2}
                y={y + TILE_H / 2 - 4}
                textAnchor="middle"
                dominantBaseline="central"
                fill={textColor}
                fontSize="13"
                fontWeight="700"
                fontFamily="DM Sans, system-ui"
              >
                {state.abbr}
              </text>
              {/* Score (if has data) */}
              {score > 0 && (
                <text
                  x={x + TILE_W / 2}
                  y={y + TILE_H / 2 + 12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textColor}
                  fontSize="9"
                  fontWeight="500"
                  fontFamily="DM Sans, system-ui"
                  opacity={0.75}
                >
                  {score}
                </text>
              )}
              {/* ACCC office indicator dot */}
              {isACCC && (
                <circle
                  cx={x + TILE_W - 8}
                  cy={y + 8}
                  r={3.5}
                  fill="#1B5EA8"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}

        {/* Legend — positioned below the state grid */}
        {[
          { label: 'Critical', color: '#DC2626', score: '80+' },
          { label: 'High', color: '#D97706', score: '65-79' },
          { label: 'Moderate', color: '#2563EB', score: '50-64' },
          { label: 'Low', color: '#93C5FD', score: '30-49' },
          { label: 'No data', color: '#E2E8F0', score: '<30' },
        ].map((item, i) => {
          const lx = PAD_X + i * 120;
          const ly = gridH + 10;
          return (
            <g key={item.label}>
              <rect x={lx} y={ly} width={12} height={12} rx={2} fill={item.color} opacity={0.88} />
              <text
                x={lx + 16}
                y={ly + 6}
                dominantBaseline="central"
                fill="#475569"
                fontSize="9"
                fontFamily="DM Sans, system-ui"
              >
                {item.label} ({item.score})
              </text>
            </g>
          );
        })}

        {/* ACCC office legend */}
        <g>
          <circle cx={PAD_X + 605} cy={gridH + 16} r={3.5} fill="#1B5EA8" stroke="#FFFFFF" strokeWidth={1.5} />
          <text
            x={PAD_X + 613}
            y={gridH + 16}
            dominantBaseline="central"
            fill="#475569"
            fontSize="9"
            fontFamily="DM Sans, system-ui"
          >
            ACCC Office
          </text>
        </g>

        {/* Hover tooltip for state */}
        {hoveredState && (() => {
          const state = STATE_GRID.find((s) => s.abbr === hoveredState);
          if (!state) return null;
          const x = PAD_X + state.col * (TILE_W + GAP) + TILE_W / 2;
          const y = PAD_Y + state.row * (TILE_H + GAP) - 8;
          const score = scores[hoveredState] || 0;
          const officeName = STATE_TO_OFFICE[hoveredState];
          const office = officeName ? offices.find((o) => o.city === officeName) : null;
          const boxW = office ? 160 : 120;
          const boxH = office ? 72 : 34;

          return (
            <g>
              <rect
                x={Math.max(4, Math.min(x - boxW / 2, totalW - boxW - 4))}
                y={y - boxH}
                width={boxW}
                height={boxH}
                rx={6}
                fill="#0F172A"
                opacity={0.95}
              />
              <text
                x={Math.max(4 + boxW / 2, Math.min(x, totalW - boxW / 2 - 4))}
                y={y - boxH + 16}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="600"
                fontFamily="DM Sans, system-ui"
              >
                {state.name} ({hoveredState})
              </text>
              {score > 0 && (
                <text
                  x={Math.max(4 + boxW / 2, Math.min(x, totalW - boxW / 2 - 4))}
                  y={y - boxH + 30}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="DM Sans, system-ui"
                >
                  Distress Score: {score}
                </text>
              )}
              {office && (
                <>
                  <text
                    x={Math.max(4 + boxW / 2, Math.min(x, totalW - boxW / 2 - 4))}
                    y={y - boxH + 46}
                    textAnchor="middle"
                    fill="#93C5FD"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="DM Sans, system-ui"
                  >
                    {office.city} Office
                  </text>
                  <text
                    x={Math.max(4 + boxW / 2, Math.min(x, totalW - boxW / 2 - 4))}
                    y={y - boxH + 60}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="8"
                    fontFamily="DM Sans, system-ui"
                  >
                    {office.prospects ? `${formatNumber(office.prospects)} prospects` : ''}
                    {office.critical ? ` · ${formatNumber(office.critical)} critical` : ''}
                  </text>
                </>
              )}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
