// Updated types for the new Entity Sports API response structure

export interface Competition {
  cid: number
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
  team_id: number
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
  temp: number
  humidity: number
  visibility: number
  wind_speed: number
  clouds: number
}

export interface Pitch {
  pitch_condition: string
  batting_condition: string
  pace_bowling_condition: string
  spine_bowling_condition: string
}

export interface Toss {
  text: string
  winner: number
  decision: number
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
  run1?: string
  run2?: string
  run3?: string
  run5?: string
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
  bowledcount?: string
  lbwcount?: string
}

export interface Fielder {
  fielder_id: string
  fielder_name: string
  catches: number
  stumping: number
  is_substitute: string
}

export interface Powerplay {
  p1: {
    startover: string
    endover: string
  }
}

export interface Review {
  batting: {
    batting_team_total_review: string
    batting_team_review_success: string
    batting_team_review_failed: string
    batting_team_review_available: string
    batting_team_review_retained: string
  }
  bowling: {
    bowling_team_total_review: string
    bowling_team_review_success: string
    bowling_team_review_failed: string
    bowling_team_review_available: string
    bowling_team_review_retained: string
  }
}

export interface FallOfWicket {
  name: string
  batsman_id: string
  runs: string
  balls: string
  how_out: string
  score_at_dismissal: number
  overs_at_dismissal: string
  bowler_id: string
  dismissal: string
  number: number
}

export interface Partnership {
  runs: number
  balls: number
  overs: number
  batsmen: Array<{
    name: string
    batsman_id: number
    runs: number
    balls: number
  }>
}

export interface DidNotBat {
  player_id: string
  name: string
}

export interface LastWicket {
  name: string
  batsman_id: string
  runs: string
  balls: string
  how_out: string
  score_at_dismissal: number
  overs_at_dismissal: string
  bowler_id: string
  dismissal: string
  number: number
}

export interface ExtraRuns {
  byes: number
  legbyes: number
  wides: number
  noballs: number
  penalty: string
  total: number
}

export interface Equations {
  runs: number
  wickets: number
  overs: string
  bowlers_used: number
  runrate: string
}

export interface Innings {
  iid: number
  number: number
  name: string
  short_name: string
  status: number
  issuperover: string
  result: number
  batting_team_id: number
  fielding_team_id: number
  scores: string
  scores_full: string
  batsmen: Batsman[]
  bowlers: Bowler[]
  fielder: Fielder[]
  powerplay: Powerplay
  fows: FallOfWicket[]
  last_wicket: LastWicket
  extra_runs: ExtraRuns
  equations: Equations
  current_partnership: Partnership
  did_not_bat: DidNotBat[]
  max_over: string
  review: Review
}

export interface Scorecard {
  innings: Innings[]
  is_followon: number
  day_remaining_over: string
}

export interface SquadPlayer {
  player_id: string
  substitute: string
  out: string
  in: string
  role_str: string
  role: string
  playing11: string
  name: string
}

export interface TeamSquad {
  team_id: number
  squads: SquadPlayer[]
}

export interface MatchPlaying11 {
  teama: TeamSquad
  teamb: TeamSquad
}

export interface ManOfTheMatch {
  pid: number
  name: string
  thumb_url: string
}

export interface LiveScore {
  runs: number
  overs: number
  wickets: number
  target: number
  runrate: number
  required_runrate: string
}

export interface LiveBatsman {
  name: string
  batsman_id: number
  runs: number
  balls_faced: number
  fours: number
  sixes: number
  strike_rate: string
}

export interface LiveBowler {
  name: string
  bowler_id: number
  overs: number
  runs_conceded: number
  wickets: number
  maidens: number
  econ: string
}

export interface CommentaryBall {
  event_id: string
  event: string
  batsman_id: string
  bowler_id: string
  over: string
  ball: string
  score: number
  commentary: string
  noball_dismissal: boolean
  text: string
  timestamp: number
  run: number
  noball_run: string
  wide_run: string
  bye_run: string
  legbye_run: string
  bat_run: number
  odds: any
  xball: number
}

export interface CommentaryOver {
  event: string
  over: number
  runs: number
  score: string
  bats: Array<{
    runs: number
    balls_faced: number
    fours: number
    sixes: number
    batsman_id: number
  }>
  bowls: Array<{
    runs_conceded: number
    maidens: number
    wickets: number
    bowler_id: number
    overs: number
  }>
  commentary: string
}

export interface LiveInning {
  iid: number
  number: number
  name: string
  short_name: string
  status: number
  issuperover: string
  result: number
  batting_team_id: number
  fielding_team_id: number
  scores: string
  scores_full: string
  fielder: Fielder[]
  powerplay: Powerplay
  last_wicket: LastWicket
  extra_runs: ExtraRuns
  equations: Equations
  current_partnership: Partnership
  did_not_bat: DidNotBat[]
  max_over: string
  review: Review
  recent_scores: string
  last_five_overs: string
  last_ten_overs: string
}

export interface Live {
  mid: number
  status: number
  status_str: string
  game_state: number
  game_state_str: string
  status_note: string
  team_batting: string
  team_bowling: string
  live_inning_number: number
  live_score: LiveScore
  batsmen: LiveBatsman[]
  bowlers: LiveBowler[]
  commentaries: (CommentaryBall | CommentaryOver)[]
  live_inning: LiveInning
}

export interface Player {
  pid: number
  title: string
  short_name: string
  first_name: string
  last_name: string
  middle_name: string
  birthdate: string
  birthplace: string
  country: string
  logo_url: string
  playing_role: string
  batting_style: string
  bowling_style: string
  fielding_position: string
  facebook_profile: string
  twitter_profile: string
  instagram_profile: string
  nationality: string
}

export interface MatchInfo {
  match_id: number
  title: string
  short_title: string
  subtitle: string
  match_number: string
  format: number
  format_str: string
  status: number
  status_str: string
  status_note: string
  game_state: number
  game_state_str: string
  domestic: string
  competition: Competition
  teama: Team
  teamb: Team
  date_start: string
  date_end: string
  timestamp_start: number
  timestamp_end: number
  date_start_ist: string
  date_end_ist: string
  venue: Venue
  umpires: string
  referee: string
  equation: string
  live: string
  result: string
  result_type: number
  win_margin: string
  winning_team_id: number
  commentary: number
  wagon: number
  latest_inning_number: number
  oddstype: string
  weather: Weather
  pitch: Pitch
  toss: Toss
}

export interface MatchInfoApiResponse {
  match_id: number
  match_info: MatchInfo
  "match-playing11": MatchPlaying11
  match_notes: string[][]
  man_of_the_match: ManOfTheMatch
  man_of_the_series: any[]
  scorecard: Scorecard
  live: Live
  live_odds: any[]
  session_odds: any[]
  featured_session: any[]
  players: Player[]
}

// Legacy interface for backward compatibility
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
  players: Player[]
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

// Helper function to convert new API response to legacy format
export function convertApiResponseToLegacyFormat(apiResponse: MatchInfoApiResponse): CricketMatchData {
  const { match_info, scorecard, live, players } = apiResponse

  return {
    competition: match_info.competition,
    teama: match_info.teama,
    teamb: match_info.teamb,
    venue: match_info.venue,
    weather: match_info.weather,
    pitch: match_info.pitch,
    toss: match_info.toss,
    commentary: match_info.commentary.toString(),
    current_over: live?.live_score?.overs?.toString() || "",
    match_id: match_info.match_id.toString(),
    date_end: match_info.date_end,
    date_end_ist: match_info.date_end_ist,
    date_start: match_info.date_start,
    date_start_ist: match_info.date_start_ist,
    equation: match_info.equation,
    format: match_info.format.toString(),
    format_str: match_info.format_str,
    game_state: match_info.game_state.toString(),
    game_state_str: match_info.game_state_str,
    innings: scorecard.innings,
    last_five_overs: live?.live_inning?.last_five_overs || "",
    latest_inning_number: match_info.latest_inning_number.toString(),
    live: match_info.live,
    live_inning_number: live?.live_inning_number?.toString() || "",
    man_of_the_match: apiResponse.man_of_the_match?.name || "",
    man_of_the_series: "",
    match_dls_affected: "",
    match_notes: apiResponse.match_notes ? apiResponse.match_notes.flat().join(", ") : "",
    match_number: apiResponse.match_notes || [[]],
    odds_available: "",
    players: players as any,
    pre_squad: "",
    presquad_time: "",
    previous_over: "",
    referee: match_info.referee,
    result: match_info.result,
    result_type: match_info.result_type.toString(),
    short_title: match_info.short_title,
    status: match_info.status.toString(),
    status_note: match_info.status_note,
    status_str: match_info.status_str,
    subtitle: match_info.subtitle,
    team_batting_first: "",
    team_batting_second: "",
    timestamp_end: match_info.timestamp_end.toString(),
    timestamp_start: match_info.timestamp_start.toString(),
    title: match_info.title,
    umpires: match_info.umpires,
    verified: "",
    verify_time: "",
    wagon: match_info.wagon.toString(),
    win_margin: match_info.win_margin,
    winning_team_id: match_info.winning_team_id.toString(),
  }
}
