import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsApi, categoriesApi } from '../api/transactions';
import { nlpApi } from '../api/nlp';
import type { Category } from '../types/transaction';
import { LuxuryCard, LuxuryInput, LuxuryTextarea, LuxurySelect, LuxuryButton } from '../components/luxury';

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
        <h1 className="font-display text-4xl font-bold text-luxury-gold tracking-wide">新建交易</h1>
        <p className="text-luxury-brown mt-2 tracking-wide">添加一笔新的收入或支出记录</p>
      </div>

      <LuxuryCard className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-expense-light/20 border border-expense text-expense px-6 py-4 rounded-md flex items-center space-x-3">
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Input Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-luxury-darkBrown mb-4 tracking-wide uppercase">
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
                <div className={`${inputMode === 'nlp' ? 'bg-gradient-to-r from-luxury-gold to-luxury-lightGold text-white border-luxury-gold' : 'bg-luxury-cream text-luxury-darkBrown border-luxury-border'} flex items-center justify-center space-x-2 p-4 rounded-md transition-all duration-300 border`}>
                  <span className="font-medium tracking-wide">AI 智能输入</span>
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
                <div className={`${inputMode === 'manual' ? 'bg-gradient-to-r from-luxury-gold to-luxury-lightGold text-white border-luxury-gold' : 'bg-luxury-cream text-luxury-darkBrown border-luxury-border'} flex items-center justify-center space-x-2 p-4 rounded-md transition-all duration-300 border`}>
                  <span className="font-medium tracking-wide">手动输入</span>
                </div>
              </label>
            </div>
          </div>

          {/* NLP Input Section */}
          {inputMode === 'nlp' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="nlpText" className="block text-sm font-medium text-luxury-darkBrown mb-3 tracking-wide uppercase">
                  描述你的交易
                </label>
                <textarea
                  id="nlpText"
                  rows={4}
                  className="block w-full px-6 py-4 border-2 border-luxury-gold/30 rounded-md shadow-luxury focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold bg-white text-luxury-darkBrown placeholder-luxury-brown"
                  placeholder="例如：今天午餐花了50块，或者收到工资5000元"
                  value={nlpText}
                  onChange={(e) => setNlpText(e.target.value)}
                />
              </div>

              {/* Example Buttons */}
              <div>
                <label className="block text-sm font-medium text-luxury-darkBrown mb-3 tracking-wide uppercase">
                  快速示例
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleExampleClick('今天午餐花了50块')}
                    className="px-6 py-3 text-sm bg-luxury-cream hover:bg-luxury-lightBeige text-luxury-darkBrown rounded-md transition-all duration-300 font-medium border border-luxury-border"
                  >
                    今天午餐花了50块
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExampleClick('昨天买咖啡花了35元')}
                    className="px-6 py-3 text-sm bg-luxury-cream hover:bg-luxury-lightBeige text-luxury-darkBrown rounded-md transition-all duration-300 font-medium border border-luxury-border"
                  >
                    昨天买咖啡花了35元
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExampleClick('收到工资5000元')}
                    className="px-6 py-3 text-sm bg-income-light hover:bg-income text-luxury-darkBrown hover:text-white rounded-md transition-all duration-300 font-medium border border-income"
                  >
                    收到工资5000元
                  </button>
                </div>
              </div>

              {/* Parse Button */}
              <div className="flex justify-center pt-4">
                <LuxuryButton
                  type="button"
                  onClick={handleParse}
                  disabled={parsing || !nlpText.trim()}
                  variant="primary"
                  className="px-12 py-4"
                >
                  {parsing ? 'AI 解析中...' : 'AI 解析'}
                </LuxuryButton>
              </div>
            </div>
          )}

          {/* Manual Input Section */}
          {inputMode === 'manual' && (
            <div className="space-y-6">
              {parsed && (
                <div className="bg-income-light/30 border border-income text-income-dark px-6 py-4 rounded-md flex items-center space-x-3">
                  <span className="font-semibold tracking-wide">AI 已为你填充表单，你可以继续编辑后保存</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-luxury-darkBrown mb-4 tracking-wide uppercase">
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
                    <div className={`${transactionType === 'expense' ? 'bg-gradient-to-r from-expense to-expense-dark text-white border-expense' : 'bg-luxury-cream text-luxury-darkBrown border-luxury-border'} flex items-center justify-center space-x-2 p-4 rounded-md transition-all duration-300 border`}>
                      <span className="font-medium tracking-wide">支出</span>
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
                    <div className={`${transactionType === 'income' ? 'bg-gradient-to-r from-income to-income-dark text-white border-income' : 'bg-luxury-cream text-luxury-darkBrown border-luxury-border'} flex items-center justify-center space-x-2 p-4 rounded-md transition-all duration-300 border`}>
                      <span className="font-medium tracking-wide">收入</span>
                    </div>
                  </label>
                </div>
              </div>

              <LuxuryInput
                label="金额（元）"
                id="amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <LuxurySelect
                label="类别"
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </LuxurySelect>

              <LuxuryInput
                label="日期"
                id="transactionDate"
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />

              <LuxuryTextarea
                label="备注（可选）"
                id="description"
                rows={3}
                placeholder="添加备注..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-luxury-border">
            <LuxuryButton
              type="button"
              onClick={() => navigate('/app/transactions')}
              variant="secondary"
            >
              取消
            </LuxuryButton>
            {inputMode === 'manual' && (
              <LuxuryButton
                type="submit"
                disabled={loading}
                variant="primary"
              >
                {loading ? '保存中...' : '保存'}
              </LuxuryButton>
            )}
          </div>
        </form>
      </LuxuryCard>
    </div>
  );
};

export default NewTransaction;
