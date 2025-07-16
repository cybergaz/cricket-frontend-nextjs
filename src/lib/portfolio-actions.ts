import { cookies } from 'next/headers';
import { PlayerHolding, TeamHolding, } from '@/types/user';
import "dotenv/config";
import { PlayerPortfolioData, SellPlayerData, TeamPortfolioData, SellTeamData } from '@/types/portfolio';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;


const getToken = async () => {
  console.log('Fetching token from cookies');
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  console.log('fetched token:', token);
  if (!token) throw new Error('Token not found in cookies');
  return token;
};

export const storePortfolio = async (PlayerPortfolioData: PlayerPortfolioData): Promise<PlayerHolding> => {
  const token = getToken();

  const response = await fetch(`${BACKEND_URL}/portfolio/store-player-portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', },
    body: JSON.stringify(PlayerPortfolioData),
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update portfolio');

  return data.portfolio;
};

export const sellPortfolio = async (SellPlayerData: SellPlayerData): Promise<PlayerHolding> => {
  const token = getToken();

  const response = await fetch(`${BACKEND_URL}/portfolio/sell-player-portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', },
    body: JSON.stringify(SellPlayerData),
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to sell stocks');

  return data.portfolio;
};

export const getPortfolio = async (): Promise<PlayerHolding[]> => {
  const token = getToken();

  const response = await fetch(`${BACKEND_URL}/portfolio/get-player-portfolio`, {
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch portfolio');

  return data.portfolio;
};

export const storeTeamPortfolio = async (teamPortfolioData: TeamPortfolioData): Promise<TeamHolding> => {
  const token = getToken();

  const response = await fetch(`${BACKEND_URL}/portfolio/store-team-portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', },
    body: JSON.stringify(teamPortfolioData),
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update team portfolio');

  return data.teamPortfolio;
};

export const sellTeamPortfolio = async (sellData: SellTeamData): Promise<TeamHolding> => {
  const token = getToken();

  const response = await fetch(`${BACKEND_URL}/portfolio/sell-team-portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', },
    body: JSON.stringify(sellData),
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to sell team stocks');

  return data.teamPortfolio;
};

export const getTeamPortfolio = async (): Promise<TeamHolding[]> => {
  const token = getToken();

  const response = await fetch(`${BACKEND_URL}/portfolio/get-team-portfolio`, {
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch team portfolio');

  return data.teamPortfolio;
};
