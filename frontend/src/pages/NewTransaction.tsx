import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsApi, categoriesApi } from '../api/transactions';
import type { Category } from '../types/transaction';

const NewTransaction: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.categories);
      if (response.categories.length > 0) {
        setCategory(response.categories[0].name);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue)) {
        setError('请输入有效的金额');
        setLoading(false);
        return;
      }

      await transactionsApi.create({
        input_method: 'manual',
        amount: transactionType === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue),
        category,
        description: description || undefined,
        transaction_date: transactionDate,
      });

      navigate('/app/transactions');
    } catch (err: any) {
      setError(err.response?.data?.detail || '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">新建交易</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              交易类型
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="transactionType"
                  value="expense"
                  checked={transactionType === 'expense'}
                  onChange={(e) => setTransactionType(e.target.value as 'expense')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">支出</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="transactionType"
                  value="income"
                  checked={transactionType === 'income'}
                  onChange={(e) => setTransactionType(e.target.value as 'income')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">收入</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              金额（元）
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              类别
            </label>
            <select
              id="category"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              日期
            </label>
            <input
              type="date"
              id="date"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              备注（可选）
            </label>
            <textarea
              id="description"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="添加备注..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/app/transactions')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTransaction;
