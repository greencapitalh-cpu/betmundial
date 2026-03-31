'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PitchSVG from '@/components/PitchSVG';

const liveGames = [
  { id: 1, league: 'EPL', home: 'Arsenal', away: 'Chelsea', homeScore: 2, awayScore: 1, minute: 67, status: 'LIVE' },
  { id: 2, league: 'La Liga', home: 'Barcelona', away: 'Real Madrid', homeScore: 1, awayScore: 1, minute: 45, status: 'HT' },
  { id: 3, league: 'Serie A', home: 'AC Milan', away: 'Juventus', homeScore: 0, awayScore: 0, minute: 12, status: 'LIVE' },
];

const stats = [
  { label: 'Games Tracked', value: 2847 },
  { label: 'MCP Feeds', value: 12 },
  { label: 'Leagues', value: 5 },
  { label: 'Players', value: 4210 },
];

export default function HomePage() {
  const [activeGame, setActiveGame] = useState(0);
  const [counters, setCounters] = useState(stats.map(() => 0));

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveGame((p) => (p + 1) % liveGames.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCounters(stats.map((s) => Math.min(Math.round((step / steps) * s.value), s.value)));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const game = liveGames[activeGame];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <PitchSVG className="w-full h-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-live"></span>
                <span className="text-red-400 text-sm font-medium">Live Now — {liveGames.length} Matches</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Every League.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#34d399]">
                  Every Goal.
                </span>{' '}
                Live.
              </h1>
              <p className="text-[#9ca3af] text-lg mb-8 max-w-lg">
                Multi-league soccer dashboard covering EPL, La Liga, Serie A, Bundesliga &amp; Ligue 1.
                Live scores, form tables, top scorers, and betting odds via MCP feeds.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/live"
                  className="px-6 py-3 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold rounded-lg hover:opacity-90 transition"
                >
                  Watch Live
                </Link>
                <Link
                  href="/scores"
                  className="px-6 py-3 border border-[#374151] text-[#9ca3af] rounded-lg hover:border-[#10b981] hover:text-[#10b981] transition"
                >
                  View Scores
                </Link>
              </div>
            </div>

            {/* Live preview card */}
            <div className="bg-[#1e293b] rounded-xl border border-[#374151] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">{game.league}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live"></span>
                  <span className="text-xs text-red-400 font-medium">{game.status} {game.status === 'LIVE' ? `${game.minute}'` : ''}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-6">
                <div className="text-center flex-1">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 flex items-center justify-center text-lg font-bold text-[#10b981]">
                    {game.home[0]}
                  </div>
                  <p className="text-sm font-medium">{game.home}</p>
                </div>
                <div className="text-center px-6">
                  <p className="text-4xl font-bold">
                    {game.homeScore} <span className="text-[#6b7280]">-</span> {game.awayScore}
                  </p>
                </div>
                <div className="text-center flex-1">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 flex items-center justify-center text-lg font-bold text-[#10b981]">
                    {game.away[0]}
                  </div>
                  <p className="text-sm font-medium">{game.away}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {liveGames.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveGame(i)}
                    className={`flex-1 h-1 rounded-full transition-colors ${i === activeGame ? 'bg-[#10b981]' : 'bg-[#374151]'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats counter */}
      <section className="border-y border-[#374151] bg-[#1e293b]/50">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-[#10b981]">{counters[i].toLocaleString()}</p>
              <p className="text-sm text-[#6b7280] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* League badges */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Covering Europe&apos;s Top 5 Leagues</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'].map((league) => (
            <div
              key={league}
              className="bg-[#1e293b] border border-[#374151] rounded-xl p-6 text-center hover:border-[#10b981] transition group"
            >
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#10b981]/30 to-[#059669]/10 flex items-center justify-center text-xl font-bold text-[#10b981] group-hover:from-[#10b981]/50 transition">
                {league[0]}
              </div>
              <p className="text-sm font-medium">{league}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Powered by MCP Feeds</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Live Score Grid', desc: 'Real-time scores grouped by league with auto-refresh via SSE connections.' },
            { title: 'Form Tables', desc: 'Team form with streak indicators — W/D/L over last 5 matches at a glance.' },
            { title: 'Top Scorers', desc: 'Cross-league leaderboard updated live. Filter by league or view combined.' },
            { title: 'Fixture Countdown', desc: 'Upcoming match tiles with countdown timers and betting odds integration.' },
            { title: 'Odds Integration', desc: 'The Odds API connector showing live betting lines across major bookmakers.' },
            { title: 'MCP Architecture', desc: 'Modular connector protocol for reliable, low-latency soccer data feeds.' },
          ].map((f) => (
            <div key={f.title} className="bg-[#1e293b] border border-[#374151] rounded-xl p-6 hover:border-[#10b981]/50 transition">
              <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 flex items-center justify-center mb-4">
                <div className="w-4 h-4 rounded-full bg-[#10b981]"></div>
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-[#6b7280]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
