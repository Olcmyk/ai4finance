import apiClient from './client';

export interface Summary {
  month: string;
  total_income: number;
  total_expense: number;
  balance: number;
  transaction_count: number;
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  percentage: number;
  count: number;
}

export const analyticsApi = {
  getSummary: async (month?: string): Promise<Summary> => {
    const params = month ? { month } : {};
    const response = await apiClient.get('/api/analytics/summary', { params });
    return response.data;
  },

  getByCategory: async (month?: string): Promise<{ month: string; categories: CategoryBreakdown[] }> => {
    const params = month ? { month } : {};
    const response = await apiClient.get('/api/analytics/by-category', { params });
    return response.data;
  },
};
