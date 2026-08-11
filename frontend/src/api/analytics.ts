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

export interface Insight {
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
  icon: string;
}

export interface InsightResponse {
  month: string;
  insights: Insight[];
  generated_at: string;
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

  getInsights: async (month?: string): Promise<InsightResponse> => {
    const params = month ? { month } : {};
    const response = await apiClient.get('/api/analytics/insights', { params });
    return response.data;
  },
};
