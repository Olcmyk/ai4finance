import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { analyticsApi } from '../api/analytics';
import type { Summary, CategoryBreakdown, Insight } from '../api/analytics';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setInsightsLoading(true);
      const [summaryData, categoryData, insightData] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getByCategory(),
        analyticsApi.getInsights(),
      ]);
      setSummary(summaryData);
      setCategories(categoryData.categories);
      setInsights(insightData.insights);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setInsightsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-beige-500 mx-auto mb-4"></div>
          <p className="text-beige-700">加载中...</p>
        </div>
      </div>
    );
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'success':
        return {
          border: 'border-l-4 border-beige-600',
          bg: 'bg-gradient-to-br from-beige-50 via-white to-beige-50/30',
          iconBg: 'bg-beige-200',
          textColor: 'text-beige-900',
        };
      case 'warning':
        return {
          border: 'border-l-4 border-beige-500',
          bg: 'bg-gradient-to-br from-beige-100 via-white to-beige-100/30',
          iconBg: 'bg-beige-300',
          textColor: 'text-beige-900',
        };
      case 'info':
      default:
        return {
          border: 'border-l-4 border-beige-400',
          bg: 'bg-gradient-to-br from-beige-50 via-white to-beige-50/30',
          iconBg: 'bg-beige-200',
          textColor: 'text-beige-900',
        };
    }
  };

  // Prepare chart data - beige color palette
  const COLORS = ['#C9B591', '#B49D76', '#9A845F', '#D4C4A8', '#E8D4B8', '#7D6B4C', '#F5E6D3', '#5D5038'];

  const pieChartData = categories.map((cat, index) => ({
    name: cat.name,
    value: parseFloat(cat.amount.toFixed(2)),
    color: COLORS[index % COLORS.length]
  }));

  const barChartData = categories.slice(0, 5).map((cat, index) => ({
    name: cat.name,
    amount: parseFloat(cat.amount.toFixed(2)),
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-beige-900 mb-1">财务概览</h1>
          <p className="text-sm text-beige-600">{summary?.month || ''} 月度报告</p>
        </div>
        <Link
          to="/app/transactions/new"
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-2xl shadow-soft text-sm font-semibold text-white bg-beige-500 hover:bg-beige-600 transform hover:scale-105 transition-all duration-200"
        >
          <span className="mr-2">+</span> 新建交易
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-gradient-to-br from-beige-400 to-beige-500 overflow-hidden shadow-soft-lg rounded-2xl transform hover:scale-105 transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-beige-100 text-sm font-medium">本月收入</p>
                <p className="mt-2 text-4xl font-bold text-white">
                  ¥{summary?.total_income.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <span className="text-4xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-beige-600 to-beige-700 overflow-hidden shadow-soft-lg rounded-2xl transform hover:scale-105 transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-beige-100 text-sm font-medium">本月支出</p>
                <p className="mt-2 text-4xl font-bold text-white">
                  ¥{summary?.total_expense.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <span className="text-4xl">💸</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-beige-500 to-beige-600 overflow-hidden shadow-soft-lg rounded-2xl transform hover:scale-105 transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-beige-100 text-sm font-medium">结余</p>
                <p className="mt-2 text-4xl font-bold text-white">
                  ¥{summary?.balance.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <span className="text-4xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-beige-500 to-beige-600 rounded-2xl p-2">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-beige-900">AI 财务洞察</h2>
          </div>
          {!insightsLoading && (
            <button
              onClick={loadData}
              className="px-4 py-2 text-sm text-beige-700 hover:text-beige-900 font-semibold bg-beige-100 hover:bg-beige-200 rounded-xl transition-colors duration-200"
            >
              🔄 刷新
            </button>
          )}
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-soft-lg p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-beige-200 rounded-2xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-beige-200 rounded w-3/4"></div>
                    <div className="h-4 bg-beige-200 rounded"></div>
                    <div className="h-4 bg-beige-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="bg-gradient-to-br from-beige-50 to-beige-100 rounded-2xl shadow-soft-lg p-12 text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <p className="text-beige-800 text-lg font-semibold">暂无财务洞察</p>
            <p className="text-sm text-beige-600 mt-2">添加更多交易记录后，AI 将为您提供个性化建议</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight, index) => {
              const styles = getSeverityStyles(insight.severity);
              return (
                <div
                  key={index}
                  className={`${styles.bg} ${styles.border} rounded-2xl shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 p-6 transform hover:-translate-y-1`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${styles.iconBg} rounded-2xl p-4 flex-shrink-0 shadow-soft`}>
                      <span className="text-4xl">{insight.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-bold ${styles.textColor} mb-2`}>
                        {insight.title}
                      </h3>
                      <p className="text-beige-800 text-sm leading-relaxed">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white shadow-soft-lg rounded-2xl p-6">
          <h3 className="text-xl font-bold text-beige-900 mb-6 flex items-center">
            <span className="mr-2">🥧</span> 支出分布
          </h3>
          {categories.length === 0 ? (
            <div className="text-center py-12 text-beige-600">
              <span className="text-5xl block mb-3">📊</span>
              <p>暂无数据</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `¥${typeof value === 'number' ? value.toFixed(2) : '0.00'}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white shadow-soft-lg rounded-2xl p-6">
          <h3 className="text-xl font-bold text-beige-900 mb-6 flex items-center">
            <span className="mr-2">📊</span> 支出排行 (Top 5)
          </h3>
          {categories.length === 0 ? (
            <div className="text-center py-12 text-beige-600">
              <span className="text-5xl block mb-3">📈</span>
              <p>暂无数据</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D4B8" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5D5038' }} />
                <YAxis tick={{ fontSize: 12, fill: '#5D5038' }} />
                <Tooltip
                  formatter={(value: any) => `¥${typeof value === 'number' ? value.toFixed(2) : '0.00'}`}
                  contentStyle={{ borderRadius: '16px', border: '2px solid #E8D4B8', backgroundColor: '#FDFCF9' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Breakdown with Progress Bars */}
      <div className="bg-white shadow-soft-lg rounded-2xl p-6">
        <h3 className="text-xl font-bold text-beige-900 mb-6 flex items-center">
          <span className="mr-2">📋</span> 详细分类
        </h3>
        {categories.length === 0 ? (
          <p className="text-beige-600 text-center py-8">暂无数据</p>
        ) : (
          <div className="space-y-5">
            {categories.map((cat, index) => (
              <div key={cat.name} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-semibold text-beige-800">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-beige-900">
                    ¥{cat.amount.toFixed(2)}
                    <span className="text-beige-600 ml-2">({cat.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-beige-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-beige-50 to-beige-100 shadow-soft-lg rounded-2xl p-6">
        <h3 className="text-xl font-bold text-beige-900 mb-6 flex items-center">
          <span className="mr-2">⚡</span> 快速操作
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/app/transactions"
            className="flex items-center p-5 bg-white border-2 border-beige-300 rounded-2xl hover:border-beige-500 hover:shadow-soft-lg transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="bg-beige-200 rounded-2xl p-3 mr-4">
              <span className="text-3xl">📝</span>
            </div>
            <div>
              <p className="font-bold text-beige-900">查看所有交易</p>
              <p className="text-sm text-beige-600">浏览完整交易记录</p>
            </div>
          </Link>
          <Link
            to="/app/transactions/new"
            className="flex items-center p-5 bg-white border-2 border-beige-300 rounded-2xl hover:border-beige-500 hover:shadow-soft-lg transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="bg-beige-200 rounded-2xl p-3 mr-4">
              <span className="text-3xl">➕</span>
            </div>
            <div>
              <p className="font-bold text-beige-900">添加新交易</p>
              <p className="text-sm text-beige-600">记录一笔收入或支出</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
