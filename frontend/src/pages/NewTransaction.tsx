import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsApi, categoriesApi } from '../api/transactions';
import { nlpApi } from '../api/nlp';
import type { Category } from '../types/transaction';
import { Button } from '../components/ui';

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
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">新建交易</h1>
        <p className="text-gray-600 text-lg">添加一笔新的收入或支出记录</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl flex items-center space-x-3 shadow-lg">
              <span className="text-2xl">⚠️</span>
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Input Mode Toggle */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-4">
              输入方式
            </label>
            <div className="flex space-x-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="inputMode"
                  value="nlp"
                  checked={inputMode === 'nlp'}
                  onChange={() => handleModeChange('nlp')}
                  className="hidden"
                />
                <div className={`${inputMode === 'nlp' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-glow-purple' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} flex items-center justify-center space-x-2 p-4 rounded-2xl transition-all duration-300 border-2 ${inputMode === 'nlp' ? 'border-transparent' : 'border-gray-300'}`}>
                  <span className="text-2xl">🤖</span>
                  <span className="font-bold">AI 智能输入</span>
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
                <div className={`${inputMode === 'manual' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-blue' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} flex items-center justify-center space-x-2 p-4 rounded-2xl transition-all duration-300 border-2 ${inputMode === 'manual' ? 'border-transparent' : 'border-gray-300'}`}>
                  <span className="text-2xl">✍️</span>
                  <span className="font-bold">手动输入</span>
                </div>
              </label>
            </div>
          </div>

          {/* NLP Input Section */}
          {inputMode === 'nlp' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="nlpText" className="block text-base font-bold text-gray-900 mb-3">
                  描述你的交易
                </label>
                <textarea
                  id="nlpText"
                  rows={4}
                  className="block w-full px-6 py-4 border-2 border-purple-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-400 text-base"
                  placeholder="例如：今天午餐花了50块，或者收到工资5000元"
                  value={nlpText}
                  onChange={(e) => setNlpText(e.target.value)}
                />
              </div>

              {/* Example Buttons */}
              <div>
                <label className="block text-base font-bold text-gray-900 mb-3">
                  快速示例
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleExampleClick('今天午餐花了50块')}
                    className="px-6 py-3 text-base bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-900 rounded-2xl transition-all duration-300 font-bold border-2 border-purple-200 hover:shadow-lg"
                  >
                    🍱 今天午餐花了50块
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExampleClick('昨天买咖啡花了35元')}
                    className="px-6 py-3 text-base bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-900 rounded-2xl transition-all duration-300 font-bold border-2 border-purple-200 hover:shadow-lg"
                  >
                    ☕ 昨天买咖啡花了35元
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExampleClick('收到工资5000元')}
                    className="px-6 py-3 text-base bg-gradient-to-r from-emerald-100 to-green-100 hover:from-emerald-200 hover:to-green-200 text-emerald-900 rounded-2xl transition-all duration-300 font-bold border-2 border-emerald-200 hover:shadow-lg"
                  >
                    💰 收到工资5000元
                  </button>
                </div>
              </div>

              {/* Parse Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  onClick={handleParse}
                  disabled={parsing || !nlpText.trim()}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-12 py-5 text-lg rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50"
                >
                  {parsing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      AI 解析中...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="text-2xl mr-2">🤖</span> AI 解析
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}

        {/* Manual Input Section */}
        {inputMode === 'manual' && (
          <div className="space-y-6">
            {parsed && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 text-emerald-800 px-6 py-4 rounded-2xl flex items-center space-x-3 shadow-lg">
                <span className="text-2xl">✅</span>
                <span className="font-semibold">AI 已为你填充表单，你可以继续编辑后保存</span>
              </div>
            )}

            <div>
              <label className="block text-base font-bold text-gray-900 mb-4">
                交易类型
              </label>
              <div className="flex space-x-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="transactionType"
                    value="expense"
                    checked={transactionType === 'expense'}
                    onChange={(e) => setTransactionType(e.target.value as 'expense')}
                    className="hidden"
                  />
                  <div className={`${transactionType === 'expense' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-glow-red' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} flex items-center justify-center space-x-2 p-4 rounded-2xl transition-all duration-300 border-2 ${transactionType === 'expense' ? 'border-transparent' : 'border-gray-300'}`}>
                    <span className="text-2xl">💸</span>
                    <span className="font-bold text-lg">支出</span>
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
                  <div className={`${transactionType === 'income' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-glow-green' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} flex items-center justify-center space-x-2 p-4 rounded-2xl transition-all duration-300 border-2 ${transactionType === 'income' ? 'border-transparent' : 'border-gray-300'}`}>
                    <span className="text-2xl">💰</span>
                    <span className="font-bold text-lg">收入</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="amount" className="block text-base font-bold text-gray-900 mb-3">
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
                className="block w-full px-6 py-4 border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500 bg-white text-gray-900 text-lg font-semibold"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-base font-bold text-gray-900 mb-3">
                类别
              </label>
              <select
                id="category"
                required
                className="block w-full px-6 py-4 border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500 bg-white text-gray-900 text-lg font-semibold"
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
              <label htmlFor="transactionDate" className="block text-base font-bold text-gray-900 mb-3">
                日期
              </label>
              <input
                id="transactionDate"
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="block w-full px-6 py-4 border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500 bg-white text-gray-900 text-lg font-semibold"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-base font-bold text-gray-900 mb-3">
                备注（可选）
              </label>
              <textarea
                id="description"
                rows={3}
                className="block w-full px-6 py-4 border-2 border-gray-300 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 text-base"
                placeholder="添加备注..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-100">
          <Button
            type="button"
            onClick={() => navigate('/app/transactions')}
            variant="outline"
            className="px-8 py-4 font-bold text-base rounded-2xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            取消
          </Button>
          {inputMode === 'manual' && (
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-12 py-4 text-base rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50"
            >
              {loading ? '保存中...' : '💾 保存'}
            </Button>
          )}
        </div>
        </form>
      </div>
    </div>
  );
};

export default NewTransaction;
