import apiClient from './client';

export interface ParseTransactionRequest {
  text: string;
}

export interface ParseTransactionResponse {
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
  confidence: number;
}

export const nlpApi = {
  parseTransaction: async (text: string): Promise<ParseTransactionResponse> => {
    const response = await apiClient.post('/api/nlp/parse-transaction', { text });
    return response.data;
  },
};
