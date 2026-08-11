import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsApi, categoriesApi } from '../api/transactions';
import { nlpApi } from '../api/nlp';
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

  // NLP input state
  const [inputMode, setInputMode] = useState<'nlp' | 'manual'>('nlp');
  const [nlpText, setNlpText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);

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

  const handleParse = async () => {
    if (!nlpText.trim()) {
      setError('请输入交易描述');
      return;
    }

    setError('');
    setParsing(true);

    try {
      const result = await nlpApi.parseTransaction(nlpText);

      // Auto-fill form with parsed results
      setAmount(Math.abs(result.amount).toString());
      setTransactionType(result.amount < 0 ? 'expense' : 'income');
      setCategory(result.category);
      setDescription(result.description);
      setTransactionDate(result.transaction_date);
      setParsed(true);

      // Switch to manual mode to show the parsed results
      setInputMode('manual');
    } catch (err: any) {
      setError(err.response?.data?.detail || '解析失败，请重试');
    } finally {
      setParsing(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setNlpText(example);
  };

  const handleModeChange = (mode: 'nlp' | 'manual') => {
    setInputMode(mode);
    setError('');
    if (mode === 'nlp') {
      setParsed(false);
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
        input_method: parsed ? 'natural_language' : 'manual',
        amount: transactionType === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue),
        category,
        description: description || undefined,
        transaction_date: transactionDate,
        original_input: parsed ? nlpText : undefined,
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

        {/* Input Mode Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输入方式
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="inputMode"
                value="nlp"
                checked={inputMode === 'nlp'}
                onChange={() => handleModeChange('nlp')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">AI 智能输入</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="inputMode"
                value="manual"
                checked={inputMode === 'manual'}
                onChange={() => handleModeChange('manual')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">手动输入</span>
            </label>
          </div>
        </div>

        {/* NLP Input Section */}
        {inputMode === 'nlp' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="nlpText" className="block text-sm font-medium text-gray-700 mb-2">
                描述你的交易
              </label>
              <textarea
                id="nlpText"
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：今天午餐花了50块，或者收到工资5000元"
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
              />
            </div>

            {/* Example Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                快速示例
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleExampleClick('今天午餐花了50块')}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  今天午餐花了50块
                </button>
                <button
                  type="button"
                  onClick={() => handleExampleClick('昨天买咖啡花了35元')}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  昨天买咖啡花了35元
                </button>
                <button
                  type="button"
                  onClick={() => handleExampleClick('收到工资5000元')}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  收到工资5000元
                </button>
              </div>
            </div>

            {/* Parse Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleParse}
                disabled={parsing || !nlpText.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {parsing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    AI 解析中...
                  </span>
                ) : (
                  'AI 解析'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Manual Input Section */}
        {inputMode === 'manual' && (
          <div className="space-y-6">
            {parsed && (
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                AI 已为你填充表单，你可以继续编辑后保存
              </div>
            )}

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
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/app/transactions')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          {inputMode === 'manual' && (
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NewTransaction;
