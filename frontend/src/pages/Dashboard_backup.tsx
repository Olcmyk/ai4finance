import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { analyticsApi } from '../api/analytics';
import type { Summary, CategoryBreakdown, Insight } from '../api/analytics';
import { Card } from '../components/ui';

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
      const [summaryData, categoryResponse, insightResponse] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getByCategory(),
        analyticsApi.getInsights(),
      ]);
      setSummary(summaryData);
      setCategories(categoryResponse.categories);
      setInsights(insightResponse.insights);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setInsightsLoading(false);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-l-4 border-red-500',
          bg: 'bg-gradient-to-br from-red-50 via-white to-red-50/30',
          iconBg: 'bg-red-200',
          textColor: 'text-red-900',
        };
      case 'important':
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

  const COLORS = ['#C9B591', '#B49D76', '#9A845F', '#D4C4A8', '#E8D4B8', '#7D6B4C', '#F5E6D3', '#5D5038'];

  const pieChartData = categories.map((cat, index) => ({
    name: cat.name,
    value: Math.abs(cat.amount),
    color: COLORS[index % COLORS.length],
  }));

  const barChartData = categories
    .slice(0, 5)
    .map((cat, index) => ({
      name: cat.name,
      amount: Math.abs(cat.amount),
      fill: COLORS[index % COLORS.length],
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-beige-200 border-t-beige-600"></div>
          <p className="mt-4 text-beige-600 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header - Full Width Card */}
      <Card className="bg-gradient-to-r from-beige-500 via-beige-400 to-beige-500 border-0">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2">欢迎回来！</h1>
            <p className="text-beige-100 text-lg flex items-center">
              <span className="mr-2">📊</span>
              这是您的 {summary?.month} 月财务概览
            </p>
          </div>
          <Link
            to="/app/transactions/new"
            className="px-8 py-4 bg-white text-beige-700 font-bold rounded-2xl hover:shadow-soft-xl transform hover:scale-105 transition-all duration-200"
          >
            <span className="text-2xl mr-2">+</span> 新建交易
          </Link>
        </div>
      </Card>

      {/* Summary Cards - 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 hover:shadow-soft-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-sm font-semibold uppercase tracking-wide mb-2">本月收入</p>
              <p className="text-4xl font-bold text-emerald-900">
                ¥{summary?.total_income.toLocaleString() || '0'}
              </p>
              <p className="text-emerald-600 text-sm mt-2">↗ 较上月增长</p>
            </div>
            <div className="bg-emerald-200 rounded-3xl p-5 shadow-lg">
              <span className="text-5xl">💰</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 hover:shadow-soft-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-700 text-sm font-semibold uppercase tracking-wide mb-2">本月支出</p>
              <p className="text-4xl font-bold text-rose-900">
                ¥{Math.abs(summary?.total_expense || 0).toLocaleString()}
              </p>
              <p className="text-rose-600 text-sm mt-2">↘ 支出分析</p>
            </div>
            <div className="bg-rose-200 rounded-3xl p-5 shadow-lg">
              <span className="text-5xl">💸</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-beige-100 to-beige-200 border-2 border-beige-300 hover:shadow-soft-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-beige-800 text-sm font-semibold uppercase tracking-wide mb-2">结余</p>
              <p className="text-4xl font-bold text-beige-900">
                ¥{summary?.balance.toLocaleString() || '0'}
              </p>
              <p className="text-beige-600 text-sm mt-2">📈 财务健康</p>
            </div>
            <div className="bg-beige-300 rounded-3xl p-5 shadow-lg">
              <span className="text-5xl">💎</span>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-beige-900 flex items-center">
            <span className="bg-gradient-to-r from-beige-400 to-beige-600 rounded-2xl p-3 mr-3 shadow-soft">
              <span className="text-3xl">🤖</span>
            </span>
            AI 财务洞察
          </h2>
          {!insightsLoading && (
            <button
              onClick={loadData}
              className="px-4 py-2 text-sm font-medium text-beige-700 bg-beige-100 hover:bg-beige-200 rounded-xl transition-all"
            >
              🔄 刷新
            </button>
          )}
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-beige-200 rounded-2xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-beige-200 rounded w-3/4"></div>
                    <div className="h-4 bg-beige-200 rounded"></div>
                    <div className="h-4 bg-beige-200 rounded w-5/6"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <Card className="text-center py-16 bg-gradient-to-br from-beige-50 to-beige-100">
            <span className="text-7xl mb-4 block">📊</span>
            <p className="text-beige-800 text-xl font-semibold">暂无财务洞察</p>
            <p className="text-beige-600 mt-2">添加更多交易记录后，AI 将为您提供个性化建议</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight, index) => {
              const styles = getSeverityStyles(insight.severity);
              return (
                <Card
                  key={index}
                  className={`${styles.bg} ${styles.border} hover:shadow-soft-xl transition-all duration-300 transform hover:-translate-y-1`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${styles.iconBg} rounded-2xl p-4 flex-shrink-0 shadow-soft`}>
                      <span className="text-4xl">{insight.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold ${styles.textColor} mb-2`}>
                        {insight.title}
                      </h3>
                      <p className="text-beige-700 text-sm leading-relaxed">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts Section - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-soft-xl transition-all duration-300">
          <h3 className="text-2xl font-bold text-beige-900 mb-6 flex items-center">
            <span className="bg-beige-100 rounded-xl p-2 mr-3">
              <span className="text-3xl">🥧</span>
            </span>
            支出分布
          </h3>
          {categories.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-7xl block mb-4">📊</span>
              <p className="text-beige-600 text-lg">暂无数据</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `¥${typeof value === 'number' ? value.toFixed(2) : '0.00'}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '2px solid #EBE3D5',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="hover:shadow-soft-xl transition-all duration-300">
          <h3 className="text-2xl font-bold text-beige-900 mb-6 flex items-center">
            <span className="bg-beige-100 rounded-xl p-2 mr-3">
              <span className="text-3xl">📊</span>
            </span>
            支出排行 (Top 5)
          </h3>
          {categories.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-7xl block mb-4">📈</span>
              <p className="text-beige-600 text-lg">暂无数据</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE3D5" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B5C42' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B5C42' }} />
                <Tooltip formatter={(value: any) => `¥${typeof value === 'number' ? value.toFixed(2) : '0.00'}`} />
                <Bar dataKey="amount" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Category Details & Quick Actions - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-soft-xl transition-all duration-300">
          <h3 className="text-2xl font-bold text-beige-900 mb-6 flex items-center">
            <span className="bg-beige-100 rounded-xl p-2 mr-3">
              <span className="text-3xl">📋</span>
            </span>
            详细分类
          </h3>
          {categories.length === 0 ? (
            <p className="text-beige-600 text-center py-8">暂无分类数据</p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => {
                const percentage = cat.percentage;
                return (
                  <div key={cat.name} className="bg-beige-50 rounded-xl p-4 hover:bg-beige-100 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-beige-900">💼 {cat.name}</span>
                      <span className="text-lg font-bold text-beige-800">
                        ¥{Math.abs(cat.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-beige-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-beige-500 to-beige-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-beige-600 mt-1">{percentage.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="hover:shadow-soft-xl transition-all duration-300">
          <h3 className="text-2xl font-bold text-beige-900 mb-6 flex items-center">
            <span className="bg-beige-100 rounded-xl p-2 mr-3">
              <span className="text-3xl">⚡</span>
            </span>
            快速操作
          </h3>
          <div className="space-y-4">
            <Link
              to="/app/transactions"
              className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl hover:border-blue-400 hover:shadow-soft-lg transition-all transform hover:scale-105"
            >
              <div className="bg-blue-200 rounded-2xl p-4 mr-4 shadow-soft">
                <span className="text-4xl">📝</span>
              </div>
              <div>
                <p className="font-bold text-blue-900 text-lg">查看所有交易</p>
                <p className="text-sm text-blue-700">浏览完整交易记录</p>
              </div>
            </Link>
            <Link
              to="/app/transactions/new"
              className="flex items-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl hover:border-purple-400 hover:shadow-soft-lg transition-all transform hover:scale-105"
            >
              <div className="bg-purple-200 rounded-2xl p-4 mr-4 shadow-soft">
                <span className="text-4xl">➕</span>
              </div>
              <div>
                <p className="font-bold text-purple-900 text-lg">添加新交易</p>
                <p className="text-sm text-purple-700">记录一笔收入或支出</p>
              </div>
            </Link>
            <Link
              to="/app/chat"
              className="flex items-center p-6 bg-gradient-to-r from-beige-50 to-beige-100 border-2 border-beige-300 rounded-2xl hover:border-beige-500 hover:shadow-soft-lg transition-all transform hover:scale-105"
            >
              <div className="bg-beige-300 rounded-2xl p-4 mr-4 shadow-soft">
                <span className="text-4xl">🤖</span>
              </div>
              <div>
                <p className="font-bold text-beige-900 text-lg">AI 财务顾问</p>
                <p className="text-sm text-beige-700">智能分析和建议</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
