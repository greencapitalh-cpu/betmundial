export type ExternalMatchResult = {
  externalId: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'live' | 'scheduled';
  updatedAt: string;
};

export async function fetchResultsFromProvider(endpoint: string): Promise<ExternalMatchResult[]> {
  const response = await fetch(endpoint, { cache: 'no-store' });
  if (!response.ok) throw new Error('Results provider unavailable');
  return response.json() as Promise<ExternalMatchResult[]>;
}

export function normalizeManualResult(externalId: string, homeScore: number, awayScore: number): ExternalMatchResult {
  return {
    externalId,
    homeScore,
    awayScore,
    status: 'final',
    updatedAt: new Date().toISOString(),
  };
}
