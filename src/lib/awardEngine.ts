export type ResultSide = 'home' | 'away' | 'draw';

export type AwardRule = 'participate' | 'winner' | 'exact' | 'goal_diff' | 'home_goals' | 'away_goals' | 'first_half_goals';

export type AwardMatch = {
  homeScore: number | null;
  awayScore: number | null;
  firstHalfHomeScore?: number | null;
  firstHalfAwayScore?: number | null;
};

export type AwardPrediction = {
  homeScore: number;
  awayScore: number;
  firstHalfHomeScore?: number | null;
  firstHalfAwayScore?: number | null;
};

function side(home: number, away: number): ResultSide {
  if (home === away) return 'draw';
  return home > away ? 'home' : 'away';
}

export function isClosed(match: AwardMatch) {
  return match.homeScore !== null && match.awayScore !== null;
}

export function qualifiesForAward(prediction: AwardPrediction, match: AwardMatch, rule: AwardRule) {
  if (!isClosed(match) || match.homeScore === null || match.awayScore === null) return false;
  if (rule === 'participate') return true;
  if (rule === 'exact') return prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore;
  if (rule === 'winner') return side(prediction.homeScore, prediction.awayScore) === side(match.homeScore, match.awayScore);
  if (rule === 'goal_diff') return prediction.homeScore - prediction.awayScore === match.homeScore - match.awayScore;
  if (rule === 'home_goals') return prediction.homeScore === match.homeScore;
  if (rule === 'away_goals') return prediction.awayScore === match.awayScore;
  if (rule === 'first_half_goals') {
    if (
      prediction.firstHalfHomeScore === undefined ||
      prediction.firstHalfAwayScore === undefined ||
      prediction.firstHalfHomeScore === null ||
      prediction.firstHalfAwayScore === null ||
      match.firstHalfHomeScore === undefined ||
      match.firstHalfAwayScore === undefined ||
      match.firstHalfHomeScore === null ||
      match.firstHalfAwayScore === null
    ) return false;
    return prediction.firstHalfHomeScore + prediction.firstHalfAwayScore === match.firstHalfHomeScore + match.firstHalfAwayScore;
  }
  return false;
}
