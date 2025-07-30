export interface Competition {
  cid: string
  title: string
  abbr: string
  type: string
  category: string
  match_format: string
  season: string
  status: string
  datestart: string
  dateend: string
  country: string
  total_matches: string
  total_rounds: string
  total_teams: string
}

export interface Team {
  team_id: string
  name: string
  short_name: string
  logo_url: string
  thumb_url: string
  scores_full: string
  scores: string
  overs: string
}

export interface Venue {
  venue_id: string
  name: string
  location: string
  country: string
  timezone: string
}

export interface Weather {
  weather: string
  weather_desc: string
  temp: string
  humidity: string
  visibility: string
  wind_speed: string
  clouds: string
}

export interface Pitch {
  pitch_condition: string
  batting_condition: string
  pace_bowling_condition: string
  spine_bowling_condition: string
}

export interface Toss {
  text: string
  winner: string
  decision: string
}

export interface Batsman {
  name: string
  batsman_id: string
  batting: string
  position: string
  role: string
  role_str: string
  runs: string
  balls_faced: string
  fours: string
  sixes: string
  run0: string
  run1: string
  run2: string
  run3: string
  run5: string
  how_out: string
  dismissal: string
  strike_rate: string
  bowler_id: string
  first_fielder_id: string
  second_fielder_id: string
  third_fielder_id: string
}

export interface Bowler {
  name: string
  bowler_id: string
  bowling: string
  position: string
  overs: string
  maidens: string
  runs_conceded: string
  wickets: string
  noballs: string
  wides: string
  econ: string
  run0: string
  bowledcount: string
  lbwcount: string
}

export interface FallOfWicket {
  name: string
  batsman_id: string
  runs: string
  balls: string
  how_out: string
  score_at_dismissal: string
  overs_at_dismissal: string
  bowler_id: string
  dismissal: string
  number: string
}

export interface Partnership {
  runs: string
  balls: string
  overs: string
  batsmen: Array<{
    name: string
    batsman_id: string
    runs: string
    balls: string
  }>
}

export interface Innings {
  iid: string
  number: string
  name: string
  short_name: string
  status: string
  batting_team_id: string
  fielding_team_id: string
  scores: string
  scores_full: string
  batsmen: Batsman[]
  bowlers: Bowler[]
  fows: FallOfWicket[]
  current_partnership: Partnership
  last_wicket: {
    name: string
    batsman_id: string
    runs: string
    balls: string
    how_out: string
    score_at_dismissal: string
    overs_at_dismissal: string
    bowler_id: string
    dismissal: string
    number: string
  }
  extra_runs: {
    byes: string
    legbyes: string
    wides: string
    noballs: string
    penalty: string
    total: string
  }
  equations: {
    runs: string
    wickets: string
    overs: string
    bowlers_used: string
    runrate: string
  }
  max_over: string
  target: string
}
export interface BettingTeam {
  team_id: string
  name: string
  short_name: string
  logo_url: string
  thumb_url: string
  scores_full: string
  scores: string
  overs: string
}

export interface BettingPlayer {
  name: string
  batsman_id: string
  batting: string
  position: string
  role: string
  role_str: string
  runs: string
  balls_faced: string
  fours: string
  sixes: string
  run0: string
  run1: string
  run2: string
  run3: string
  run5: string
  how_out: string
  dismissal: string
  strike_rate: string
  bowler_id: string
  first_fielder_id: string
  second_fielder_id: string
  third_fielder_id: string
}

export interface Player {
  pid: string
  title: string
  short_name: string
  first_name: string
  last_name: string
  middle_name: string
  birthdate: string
  birthplace: string
  country: string
  primary_team: string
  logo_url: string
  playing_role: string
  batting_style: string
  bowling_style: string
  fielding_position: string
  recent_match: string
  recent_appearance: string
  fantasy_player_rating: string
  facebook_profile: string
  twitter_profile: string
  instagram_profile: string
  debut_data: string
  bowling_type: string
  thumb_url: string
  profile_image: string
  nationality: string
  role: string
  role_str: string
}

export interface CricketMatchData {
  competition: Competition
  teama: Team
  teamb: Team
  venue: Venue
  weather: Weather
  pitch: Pitch
  toss: Toss
  commentary: string
  current_over: string
  match_id: string
  date_end: string
  date_end_ist: string
  date_start: string
  date_start_ist: string
  equation: string
  format: string
  format_str: string
  game_state: string
  game_state_str: string
  innings: Innings[]
  last_five_overs: string
  latest_inning_number: string
  live: string
  live_inning_number: string
  man_of_the_match: string
  man_of_the_series: string
  match_dls_affected: string
  match_notes: string
  match_number: string[][]
  odds_available: string
  players: [Player],
  pre_squad: string
  presquad_time: string
  previous_over: string
  referee: string
  result: string
  result_type: string
  short_title: string
  status: string
  status_note: string
  status_str: string
  subtitle: string
  team_batting_first: string
  team_batting_second: string
  timestamp_end: string
  timestamp_start: string
  title: string
  umpires: string
  verified: string
  verify_time: string
  wagon: string
  win_margin: string
  winning_team_id: string
  teamStockPrices?: {
    teama: number
    teamb: number
  }
}
export interface MatchScorecardProps {
  matchData: CricketMatchData
  matchId: string | null

}
