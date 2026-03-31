import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1e293b] border-t border-[#374151] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-bold text-xs">
                PM
              </div>
              <span className="font-bold text-white">PitchMap Global</span>
            </div>
            <p className="text-sm text-[#6b7280]">
              Multi-league soccer dashboard powered by MCP feeds. Live scores, stats, and odds across Europe&apos;s top 5 leagues.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Live Data</h4>
            <div className="space-y-2">
              <Link href="/live" className="block text-sm text-[#6b7280] hover:text-[#10b981]">Live Feed</Link>
              <Link href="/scores" className="block text-sm text-[#6b7280] hover:text-[#10b981]">Scores</Link>
              <Link href="/standings" className="block text-sm text-[#6b7280] hover:text-[#10b981]">Standings</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Analysis</h4>
            <div className="space-y-2">
              <Link href="/stats" className="block text-sm text-[#6b7280] hover:text-[#10b981]">Stats</Link>
              <Link href="/schedule" className="block text-sm text-[#6b7280] hover:text-[#10b981]">Schedule</Link>
              <Link href="/feeds" className="block text-sm text-[#6b7280] hover:text-[#10b981]">MCP Feeds</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Info</h4>
            <div className="space-y-2">
              <Link href="/about" className="block text-sm text-[#6b7280] hover:text-[#10b981]">About</Link>
              <Link href="/faq" className="block text-sm text-[#6b7280] hover:text-[#10b981]">FAQ</Link>
              <Link href="/contact" className="block text-sm text-[#6b7280] hover:text-[#10b981]">Contact</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[#374151] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#6b7280]">&copy; 2026 PitchMap Global. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse-live inline-block"></span>
            MCP Feeds Active
          </div>
        </div>
      </div>
    </footer>
  );
}
