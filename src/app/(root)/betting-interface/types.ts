// Legacy types for backward compatibility

export interface BettingPlayer {
  name: string;
  batsman_id: string;
  batting: string;
  position: string;
  role: string;
  role_str: string;
  runs: string;
  balls_faced: string;
  fours: string;
  sixes: string;
  run0: string;
  run1?: string;
  run2?: string;
  run3?: string;
  run5?: string;
  how_out: string;
  dismissal: string;
  strike_rate: string;
  bowler_id: string;
  first_fielder_id: string;
  second_fielder_id: string;
  third_fielder_id: string;
}

export interface Team {
  team_id: number;
  name: string;
  short_name: string;
  logo_url: string;
  thumb_url: string;
  scores_full: string;
  scores: string;
  overs: string;
} 