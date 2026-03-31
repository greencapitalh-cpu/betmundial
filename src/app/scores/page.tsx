'use client';

import { useState } from 'react';

const dates = ['Yesterday', 'Today', 'Tomorrow'];

const games = [
  { id: 1, league: 'EPL', home: 'Arsenal', away: 'Chelsea', hs: 2, as: 1, status: 'FT', date: 'Yesterday' },
  { id: 2, league: 'EPL', home: 'Man United', away: 'Tottenham', hs: 1, as: 3, status: 'FT', date: 'Yesterday' },
  { id: 3, league: 'La Liga', home: 'Barcelona', away: 'Real Madrid', hs: 2, as: 2, status: 'FT', date: 'Yesterday' },
  { id: 4, league: 'EPL', home: 'Man City', away: 'Liverpool', hs: 0, as: 1, status: 'LIVE 55\'', date: 'Today' },
  { id: 5, league: 'Serie A', home: 'AC Milan', away: 'Juventus', hs: 0, as: 0, status: 'LIVE 12\'', date: 'Today' },
  { id: 6, league: 'Bundesliga', home: 'Bayern Munich', away: 'Dortmund', hs: 3, as: 2, status: 'LIVE 78\'', date: 'Today' },
  { id: 7, league: 'Ligue 1', home: 'PSG', away: 'Marseille', hs: 1, as: 0, status: 'LIVE 33\'', date: 'Today' },
  { id: 8, league: 'La Liga', home: 'Atletico Madrid', away: 'Sevilla', hs: 0, as: 0, status: '15:00', date: 'Today' },
  { id: 9, league: 'EPL', home: 'Newcastle', away: 'Aston Villa', hs: 0, as: 0, status: '20:00', date: 'Tomorrow' },
  { id: 10, league: 'Serie A', home: 'Inter Milan', away: 'Napoli', hs: 0, as: 0, status: '18:45', date: 'Tomorrow' },
  { id: 11, league: 'Bundesliga', home: 'RB Leipzig', away: 'Leverkusen', hs: 0, as: 0, status: '17:30', date: 'Tomorrow' },
  { id: 12, league: 'Ligue 1', home: 'Lyon', away: 'Monaco', hs: 0, as: 0, status: '21:00', date: 'Tomorrow' },
];

const boxScoreData: Record<number, { possession: [number, number]; shots: [number, number]; corners: [number, number]; fouls: [number, number] }> = {
  1: { possession: [58, 42], shots: [14, 8], corners: [6, 3], fouls: [9, 12] },
  4: { possession: [62, 38], shots: [10, 6], corners: [5, 2], fouls: [7, 11] },
  6: { possession: [55, 45], shots: [18, 12], corners: [7, 5], fouls: [10, 8] },
};

export default function ScoresPage() {
  const [selectedDate, setSelectedDate] = useState('Today');
  const [expandedGame, setExpandedGame] = useState<number | null>(null);
  const [teamFilter, setTeamFilter] = useState('');

  const filtered = games
    .filter((g) => g.date === selectedDate)
    .filter((g) => !teamFilter || g.home.toLowerCase().includes(teamFilter.toLowerCase()) || g.away.toLowerCase().includes(teamFilter.toLowerCase()));

  const grouped = filtered.reduce<Record<string, typeof games>>((acc, g) => {
    (acc[g.league] = acc[g.league] || []).push(g);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Scoreboard</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedDate === d ? 'bg-[#10b981] text-white' : 'bg-[#1e293b] text-[#9ca3af] border border-[#374151] hover:border-[#10b981]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Filter by team..."
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-4 py-2 bg-[#1e293b] border border-[#374151] rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#10b981]"
        />
      </div>

      {Object.entries(grouped).map(([league, leagueGames]) => (
        <div key={league} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-[#10b981]">{league}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagueGames.map((g) => (
              <div key={g.id}>
                <button
                  onClick={() => setExpandedGame(expandedGame === g.id ? null : g.id)}
                  className="w-full text-left bg-[#1e293b] rounded-xl border border-[#374151] p-4 hover:border-[#10b981]/50 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      g.status.includes('LIVE') ? 'bg-red-500/20 text-red-400' : g.status === 'FT' ? 'bg-[#374151] text-[#9ca3af]' : 'bg-[#10b981]/20 text-[#10b981]'
                    }`}>
                      {g.status.includes('LIVE') && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-live mr-1"></span>}
                      {g.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{g.home}</p>
                      <p className="font-medium text-sm text-[#9ca3af]">{g.away}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{g.hs}</p>
                      <p className="font-bold">{g.as}</p>
                    </div>
                  </div>
                </button>
                {expandedGame === g.id && boxScoreData[g.id] && (
                  <div className="bg-[#1e293b] border border-t-0 border-[#374151] rounded-b-xl p-4 -mt-1">
                    <h4 className="text-xs text-[#6b7280] font-semibold mb-3">BOX SCORE</h4>
                    {Object.entries(boxScoreData[g.id]).map(([stat, vals]) => (
                      <div key={stat} className="flex items-center justify-between text-sm mb-2">
                        <span className="w-8 text-right font-medium">{vals[0]}</span>
                        <div className="flex-1 mx-3 h-1.5 bg-[#374151] rounded-full overflow-hidden flex">
                          <div className="bg-[#10b981] h-full rounded-full" style={{ width: `${(vals[0] / (vals[0] + vals[1])) * 100}%` }}></div>
                        </div>
                        <span className="text-xs text-[#6b7280] w-20 text-center capitalize">{stat}</span>
                        <div className="flex-1 mx-3 h-1.5 bg-[#374151] rounded-full overflow-hidden flex justify-end">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(vals[1] / (vals[0] + vals[1])) * 100}%` }}></div>
                        </div>
                        <span className="w-8 font-medium">{vals[1]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-16 text-[#6b7280]">No matches found.</div>
      )}
    </div>
  );
}
