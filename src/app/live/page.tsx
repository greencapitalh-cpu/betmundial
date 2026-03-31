'use client';

import { useState } from 'react';
import PitchSVG from '@/components/PitchSVG';

const leagues = ['All', 'EPL', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];

const matches = [
  { id: 1, league: 'EPL', home: 'Arsenal', away: 'Chelsea', hs: 2, as: 1, min: 67, status: 'LIVE', events: ['23\' Goal — Saka (Arsenal)', '41\' Goal — Palmer (Chelsea)', '62\' Goal — Havertz (Arsenal)'] },
  { id: 2, league: 'La Liga', home: 'Barcelona', away: 'Real Madrid', hs: 1, as: 1, min: 45, status: 'HT', events: ['12\' Goal — Yamal (Barcelona)', '38\' Goal — Vinicius (Real Madrid)'] },
  { id: 3, league: 'Serie A', home: 'AC Milan', away: 'Juventus', hs: 0, as: 0, min: 12, status: 'LIVE', events: ['8\' Yellow — Vlahovic (Juventus)'] },
  { id: 4, league: 'Bundesliga', home: 'Bayern Munich', away: 'Dortmund', hs: 3, as: 2, min: 78, status: 'LIVE', events: ['15\' Goal — Musiala (Bayern)', '22\' Goal — Brandt (Dortmund)', '50\' Goal — Kane (Bayern)', '61\' Goal — Adeyemi (Dortmund)', '72\' Goal — Sane (Bayern)'] },
  { id: 5, league: 'Ligue 1', home: 'PSG', away: 'Marseille', hs: 1, as: 0, min: 33, status: 'LIVE', events: ['28\' Goal — Dembele (PSG)'] },
  { id: 6, league: 'EPL', home: 'Man City', away: 'Liverpool', hs: 0, as: 1, min: 55, status: 'LIVE', events: ['43\' Goal — Salah (Liverpool)'] },
];

const positions = [
  { x: 120, y: 80, label: 'GK' },
  { x: 80, y: 50, label: 'LB' },
  { x: 100, y: 70, label: 'CB' },
  { x: 140, y: 70, label: 'CB' },
  { x: 160, y: 50, label: 'RB' },
  { x: 100, y: 110, label: 'CM' },
  { x: 140, y: 110, label: 'CM' },
  { x: 70, y: 140, label: 'LW' },
  { x: 120, y: 130, label: 'AM' },
  { x: 170, y: 140, label: 'RW' },
  { x: 120, y: 160, label: 'ST' },
];

export default function LivePage() {
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [selectedMatch, setSelectedMatch] = useState(0);

  const filtered = selectedLeague === 'All' ? matches : matches.filter((m) => m.league === selectedLeague);
  const active = filtered[selectedMatch] || filtered[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse-live"></span>
        <h1 className="text-3xl font-bold">Live Feed</h1>
        <span className="text-sm text-[#6b7280]">{matches.length} matches in progress</span>
      </div>

      {/* League filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {leagues.map((l) => (
          <button
            key={l}
            onClick={() => { setSelectedLeague(l); setSelectedMatch(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedLeague === l
                ? 'bg-[#10b981] text-white'
                : 'bg-[#1e293b] text-[#9ca3af] border border-[#374151] hover:border-[#10b981]'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Game selector sidebar */}
        <div className="space-y-3">
          {filtered.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setSelectedMatch(i)}
              className={`w-full text-left bg-[#1e293b] rounded-xl border p-4 transition ${
                i === selectedMatch ? 'border-[#10b981]' : 'border-[#374151] hover:border-[#10b981]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6b7280]">{m.league}</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-live"></span>
                  <span className="text-xs text-red-400">{m.status} {m.min}&apos;</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{m.home}</span>
                <span className="font-bold">{m.hs} - {m.as}</span>
                <span className="text-sm font-medium">{m.away}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Main display */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score header */}
          <div className="bg-[#1e293b] rounded-xl border border-[#374151] p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#6b7280]">{active.league}</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live"></span>
                <span className="text-sm text-red-400 font-medium">{active.status} {active.min}&apos;</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 flex items-center justify-center text-2xl font-bold text-[#10b981]">
                  {active.home[0]}
                </div>
                <p className="font-semibold">{active.home}</p>
              </div>
              <p className="text-5xl font-bold">{active.hs} <span className="text-[#374151]">-</span> {active.as}</p>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 flex items-center justify-center text-2xl font-bold text-[#10b981]">
                  {active.away[0]}
                </div>
                <p className="font-semibold">{active.away}</p>
              </div>
            </div>
          </div>

          {/* Pitch position diagram */}
          <div className="bg-[#1e293b] rounded-xl border border-[#374151] p-6">
            <h3 className="text-sm font-semibold text-[#6b7280] mb-4">Formation — {active.home}</h3>
            <div className="relative">
              <PitchSVG className="w-full max-w-md mx-auto opacity-40" />
              <svg viewBox="0 0 240 200" className="absolute inset-0 w-full max-w-md mx-auto">
                {positions.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="10" fill="#10b981" opacity="0.8" />
                    <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">{p.label}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Event stream */}
          <div className="bg-[#1e293b] rounded-xl border border-[#374151] p-6">
            <h3 className="text-sm font-semibold text-[#6b7280] mb-4">Play-by-Play</h3>
            <div className="space-y-3">
              {active.events.map((ev, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[#10b981] mt-1.5 shrink-0"></div>
                  <p>{ev}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
