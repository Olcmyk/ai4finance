import apiClient from './client';
import type { Transaction, Category } from '../types/transaction';

export interface CreateTransactionData {
  input_method: 'manual' | 'natural_language';
  amount?: number;
  category?: string;
  description?: string;
  transaction_date?: string;
  original_input?: string;
}

export interface TransactionListResponse {
  total: number;
  page: number;
  page_size: number;
  data: Transaction[];
}

export const transactionsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    category?: string;
  }): Promise<TransactionListResponse> => {
    const response = await apiClient.get('/api/transactions', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get(`/api/transactions/${id}`);
    return response.data;
  },

  create: async (data: CreateTransactionData): Promise<Transaction> => {
    const response = await apiClient.post('/api/transactions', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateTransactionData>): Promise<Transaction> => {
    const response = await apiClient.put(`/api/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/transactions/${id}`);
  },
};

export const categoriesApi = {
  getAll: async (): Promise<{ categories: Category[] }> => {
    const response = await apiClient.get('/api/categories');
    return response.data;
  },
};
