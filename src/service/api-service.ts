import httpClient from './http-client';

// All API calls will automatically include HTTP-only cookies via httpClient
class ApiService {
  // Authentication APIs
  async login(credentials: { mobile: string; password: string }) {
    return httpClient.post('/auth/login', credentials);
  }

  async logout() {
    return httpClient.post('/auth/logout');
  }

  async whoAmI() {
    return httpClient.get('/auth/whoami');
  }

  async sendOTP(data: { mobile: string }) {
    return httpClient.post('/auth/send-otp', data);
  }

  async verifyOTP(data: { mobile: string; otp: string; name?: string; email?: string; password?: string; referralCode?: string }) {
    return httpClient.post('/auth/verify-otp', data);
  }

  async googleLogin(googleData: { googleId: string; email: string; name: string }) {
    return httpClient.post('/auth/google-login', googleData);
  }

  // User APIs
  async getUserData() {
    return httpClient.get('/user/data');
  }

  async updateUserProfile(userData: any) {
    return httpClient.put('/user/profile', userData);
  }

  async getUserTransactions() {
    return httpClient.get('/user/transactions');
  }

  // Match APIs
  async getAllStoredMatches() {
    return httpClient.get('/matches/all-stored-matches');
  }

  async getMatchById(matchId: string) {
    return httpClient.get(`/matches/${matchId}`);
  }

  async getMatchPlayers(matchId: string) {
    return httpClient.get(`/matches/${matchId}/players`);
  }

  // Cricket APIs
  async getTodayMatches() {
    return httpClient.get('/cricket/today');
  }

  async getCricketMatch(matchId: string) {
    return httpClient.get(`/cricket/match/${matchId}`);
  }

  async getMatchData(matchId: string) {
    return httpClient.get(`/cricket/match-data/${matchId}`);
  }

  // Portfolio APIs
  async getAllPortfolios() {
    return httpClient.get('/portfolio/all');
  }

  async buyPlayer(data: { matchId: string; playerId: string; quantity: number; price: number }) {
    return httpClient.post('/portfolio/buy-player', data);
  }

  async sellPlayer(data: { matchId: string; playerId: string; quantity: number; price: number }) {
    return httpClient.post('/portfolio/sell-player', data);
  }

  async buyTeam(data: { matchId: string; teamId: string; quantity: number; price: number }) {
    return httpClient.post('/portfolio/buy-team', data);
  }

  async sellTeam(data: { matchId: string; teamId: string; quantity: number; price: number }) {
    return httpClient.post('/portfolio/sell-team', data);
  }

  // Legacy Portfolio APIs
  async storePlayerPortfolio(data: any) {
    return httpClient.post('/portfolio/store-player-portfolio', data);
  }

  async sellPlayerPortfolio(data: any) {
    return httpClient.post('/portfolio/sell-player-portfolio', data);
  }

  async getPlayerPortfolio() {
    return httpClient.get('/portfolio/get-player-portfolio');
  }

  async storeTeamPortfolio(data: any) {
    return httpClient.post('/portfolio/store-team-portfolio', data);
  }

  async sellTeamPortfolio(data: any) {
    return httpClient.post('/portfolio/sell-team-portfolio', data);
  }

  async getTeamPortfolio() {
    return httpClient.get('/portfolio/get-team-portfolio');
  }

  // Payment APIs
  async createPaymentOrder(amount: number) {
    return httpClient.post('/payment/create-order', { amount });
  }

  async verifyPayment(paymentData: any) {
    return httpClient.post('/payment/verify', paymentData);
  }

  async addMoney(data: { amount: number; orderId: string }) {
    return httpClient.post('/payment/add-money', data);
  }

  async withdrawMoney(data: { amount: number }) {
    return httpClient.post('/payment/withdraw', data);
  }

  // Upload APIs
  async uploadProfile(formData: FormData) {
    return httpClient.upload('/upload/upload-profile', formData);
  }

  // Admin APIs
  async fetchUsers(page: number = 1, limit: number = 10, query?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (query) {
      params.append('query', query);
    }
    return httpClient.get(`/admin/fetch-users?${params}`);
  }

  async promoteUserToAdmin(userId: string) {
    return httpClient.post('/admin/promote-user-to-admin', { userId });
  }

  async getTotalUsers() {
    return httpClient.get('/admin/total-users');
  }

  async getCompanyProfit() {
    return httpClient.get('/admin/company-profit');
  }

  async getCompanyLoss() {
    return httpClient.get('/admin/company-loss');
  }

  async getAllAdmins() {
    return httpClient.get('/admin/fetch-all-admins');
  }

  async getProfitableUsers() {
    return httpClient.get('/admin/fetch-profitable-users');
  }

  async getUsersWithLoss() {
    return httpClient.get('/admin/fetch-users-having-loss');
  }

  async getInactiveUsers() {
    return httpClient.get('/admin/fetch-inactive-users');
  }

  async getUserDetails(userId: string) {
    return httpClient.get(`/admin/user-details/${userId}`);
  }

  async getAdminDashboardData() {
    return httpClient.get('/admin/dashboard-data');
  }
}

export const apiService = new ApiService();
export default apiService;
