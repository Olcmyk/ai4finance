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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">新建交易</h1>
        <p className="text-gray-600 mt-2">添加一笔新的收入或支出记录</p>
      </div>

      <div className="bg-white rounded-xl shadow-card p-8 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Input Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              输入方式
            </label>
            <div className="flex space-x-3">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="inputMode"
                  value="nlp"
                  checked={inputMode === 'nlp'}
                  onChange={() => handleModeChange('nlp')}
                  className="hidden"
                />
                <div className={`flex items-center justify-center space-x-2 p-4 rounded-lg transition-all duration-200 border-2 ${inputMode === 'nlp' ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white border-sky-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                  <svg className={`w-5 h-5 ${inputMode === 'nlp' ? 'text-white' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className={`font-medium ${inputMode === 'nlp' ? 'text-white' : 'text-gray-700'}`}>AI 智能输入</span>
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="inputMode"
                  value="manual"
                  checked={inputMode === 'manual'}
                  onChange={() => handleModeChange('manual')}
                  className="hidden"
                />
                <div className={`flex items-center justify-center space-x-2 p-4 rounded-lg transition-all duration-200 border-2 ${inputMode === 'manual' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                  <svg className={`w-5 h-5 ${inputMode === 'manual' ? 'text-white' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className={`font-medium ${inputMode === 'manual' ? 'text-white' : 'text-gray-700'}`}>手动输入</span>
                </div>
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
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
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
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium"
                  >
                    今天午餐花了50块
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExampleClick('昨天买咖啡花了35元')}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium"
                  >
                    昨天买咖啡花了35元
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExampleClick('收到工资5000元')}
                    className="px-4 py-2 text-sm bg-success-100 hover:bg-success-200 text-success-700 rounded-lg transition-all duration-200 font-medium"
                  >
                    收到工资5000元
                  </button>
                </div>
              </div>

              {/* Parse Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={parsing || !nlpText.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {parsing ? 'AI 解析中...' : 'AI 解析'}
                </button>
              </div>
            </div>
          )}

          {/* Manual Input Section */}
          {inputMode === 'manual' && (
            <div className="space-y-5">
              {parsed && (
                <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">AI 已为你填充表单，你可以继续编辑后保存</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  交易类型
                </label>
                <div className="flex space-x-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="transactionType"
                      value="expense"
                      checked={transactionType === 'expense'}
                      onChange={(e) => setTransactionType(e.target.value as 'expense')}
                      className="hidden"
                    />
                    <div className={`flex items-center justify-center space-x-2 p-3 rounded-lg transition-all duration-200 border-2 ${transactionType === 'expense' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                      <svg className={`w-5 h-5 ${transactionType === 'expense' ? 'text-white' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      <span className={`font-medium ${transactionType === 'expense' ? 'text-white' : 'text-gray-700'}`}>支出</span>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="transactionType"
                      value="income"
                      checked={transactionType === 'income'}
                      onChange={(e) => setTransactionType(e.target.value as 'income')}
                      className="hidden"
                    />
                    <div className={`flex items-center justify-center space-x-2 p-3 rounded-lg transition-all duration-200 border-2 ${transactionType === 'income' ? 'bg-success-600 text-white border-success-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                      <svg className={`w-5 h-5 ${transactionType === 'income' ? 'text-white' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className={`font-medium ${transactionType === 'income' ? 'text-white' : 'text-gray-700'}`}>收入</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  金额（元）
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  类别
                </label>
                <select
                  id="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 mb-2">
                  日期
                </label>
                <input
                  id="transactionDate"
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  备注（可选）
                </label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="添加备注..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/transactions')}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            {inputMode === 'manual' && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTransaction;
