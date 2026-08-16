import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { analyticsApi } from '../api/analytics';
import type { Summary, CategoryBreakdown } from '../api/analytics';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, categoryResponse] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getByCategory(),
      ]);
      setSummary(summaryData);
      setCategories(categoryResponse.categories);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Modern SaaS color palette
  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const pieChartData = categories.map((cat, index) => ({
    name: cat.name,
    value: Math.abs(cat.amount),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const barChartData = categories
    .slice(0, 5)
    .map((cat, index) => ({
      name: cat.name,
      amount: Math.abs(cat.amount),
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  // Calculate AI insights
  const getAIInsights = () => {
    if (!summary || !categories.length) return null;

    const topCategory = categories[0];
    const topPercentage = topCategory.percentage.toFixed(1);

    return {
      message: `本月${topCategory.name}支出占比已达 ${topPercentage}%，共 ¥${formatCurrency(Math.abs(topCategory.amount))}`,
      type: topCategory.percentage > 50 ? 'warning' : 'info'
    };
  };

  const aiInsights = getAIInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary-600"></div>
          </div>
          <p className="mt-6 text-gray-700 font-medium text-lg">加载数据中...</p>
          <p className="mt-2 text-gray-500 text-sm">正在为您准备财务分析</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Compact Welcome Header */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-gray-500">{summary?.month}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm font-medium text-gray-500">财务概览</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {getGreeting()}
            </h1>
            <p className="text-gray-600">
              让我们一起分析您的财务状况
            </p>
          </div>
          <Link to="/app/transactions/new">
            <button className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm">
              新建交易
            </button>
          </Link>
        </div>
      </div>

      {/* AI Insights Card */}
      {aiInsights && (
        <div className={`rounded-xl p-4 border-2 ${
          aiInsights.type === 'warning'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-sky-50 border-sky-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              aiInsights.type === 'warning' ? 'bg-amber-100' : 'bg-sky-100'
            }`}>
              <svg className={`w-5 h-5 ${aiInsights.type === 'warning' ? 'text-amber-600' : 'text-sky-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-semibold ${
                  aiInsights.type === 'warning' ? 'text-amber-900' : 'text-sky-900'
                }`}>
                  AI 财务洞察
                </span>
              </div>
              <p className={`text-sm ${
                aiInsights.type === 'warning' ? 'text-amber-800' : 'text-sky-800'
              }`}>
                {aiInsights.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">本月收入</span>
            <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="font-mono text-4xl font-bold text-gray-900 mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ¥{formatCurrency(summary?.total_income || 0)}
          </p>
          <div className="flex items-center text-sm text-success-600">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            收入
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">本月支出</span>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
          <p className="font-mono text-4xl font-bold text-gray-900 mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ¥{formatCurrency(Math.abs(summary?.total_expense || 0))}
          </p>
          <div className="flex items-center text-sm text-red-600">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
            </svg>
            支出
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">结余</span>
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="font-mono text-4xl font-bold text-gray-900 mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ¥{formatCurrency(summary?.balance || 0)}
          </p>
          <div className="flex items-center text-sm text-gray-600">
            净资产
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            支出分布
          </h3>
          {categories.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-500 text-lg font-medium">暂无数据</p>
              <p className="text-gray-400 text-sm mt-2">开始记录交易即可查看分析</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#FFFFFF"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `¥${typeof value === 'number' ? formatCurrency(value) : '0.00'}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            支出排行
          </h3>
          {categories.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-500 text-lg font-medium">暂无数据</p>
              <p className="text-gray-400 text-sm mt-2">开始记录交易即可查看分析</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 500 }} />
                <YAxis tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 500 }} />
                <Tooltip
                  formatter={(value: any) => `¥${typeof value === 'number' ? formatCurrency(value) : '0.00'}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            详细分类
          </h3>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-12">暂无分类数据</p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat, idx) => {
                const percentage = cat.percentage;
                return (
                  <div key={cat.name} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-gray-900">{cat.name}</span>
                      <span className="font-mono text-lg font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ¥{formatCurrency(Math.abs(cat.amount))}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 font-medium">{percentage.toFixed(1)}% 总支出</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            快速操作
          </h3>
          <div className="space-y-3">
            <Link
              to="/app/transactions"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-primary-50 transition-colors border border-gray-200">
                <svg className="w-6 h-6 text-gray-600 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">查看所有交易</p>
                <p className="text-gray-500 text-sm">浏览完整交易记录</p>
              </div>
            </Link>
            <Link
              to="/app/transactions/new"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-primary-50 transition-colors border border-gray-200">
                <svg className="w-6 h-6 text-gray-600 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">添加新交易</p>
                <p className="text-gray-500 text-sm">记录一笔收入或支出</p>
              </div>
            </Link>
            <Link
              to="/app/ai-advisor"
              className="flex items-center p-4 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-lg hover:from-sky-100 hover:to-cyan-100 transition-all group border border-sky-200"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-sky-50 transition-colors border border-sky-300">
                <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">AI 财务顾问</p>
                <p className="text-sky-700 text-sm">获取智能财务建议</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
