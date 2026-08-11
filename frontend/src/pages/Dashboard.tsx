import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
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
          iconBg: 'bg-gradient-to-br from-red-400 to-red-600',
          textColor: 'text-red-900',
          shadow: 'hover:shadow-red-200',
        };
      case 'important':
        return {
          border: 'border-l-4 border-orange-500',
          bg: 'bg-gradient-to-br from-orange-50 via-white to-orange-50/30',
          iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
          textColor: 'text-orange-900',
          shadow: 'hover:shadow-orange-200',
        };
      case 'warning':
        return {
          border: 'border-l-4 border-yellow-500',
          bg: 'bg-gradient-to-br from-yellow-50 via-white to-yellow-50/30',
          iconBg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
          textColor: 'text-yellow-900',
          shadow: 'hover:shadow-yellow-200',
        };
      case 'info':
      default:
        return {
          border: 'border-l-4 border-blue-500',
          bg: 'bg-gradient-to-br from-blue-50 via-white to-blue-50/30',
          iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
          textColor: 'text-blue-900',
          shadow: 'hover:shadow-blue-200',
        };
    }
  };

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#6366F1'];

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
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <p className="mt-6 text-gray-700 font-semibold text-lg">加载数据中...</p>
          <p className="mt-2 text-gray-500 text-sm">正在为您准备财务分析</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Header - Enhanced Full Width Card */}
      <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 border-0 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                <span className="text-sm font-bold">财务概览</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                <span className="text-sm font-bold">{summary?.month}</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight">
              欢迎回来！
            </h1>
            <p className="text-purple-100 text-lg flex items-center">
              <span className="mr-2">📊</span>
              让我们一起分析您的财务状况
            </p>
          </div>
          <Link
            to="/app/transactions/new"
            className="group px-8 py-4 bg-white text-purple-700 font-bold rounded-2xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
          >
            <span className="text-2xl group-hover:rotate-90 transition-transform duration-300">+</span>
            <span>新建交易</span>
          </Link>
        </div>
      </Card>

      {/* Summary Cards - Enhanced 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 border-0 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-xs font-bold uppercase tracking-wide">Income</span>
                </div>
              </div>
              <p className="text-5xl font-black mb-3">
                ¥{summary?.total_income.toLocaleString() || '0'}
              </p>
              <p className="text-emerald-100 flex items-center space-x-2">
                <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-bold">本月收入</span>
                <span className="text-sm">↗ 稳步增长</span>
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <span className="text-6xl">💰</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-pink-600 border-0 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-xs font-bold uppercase tracking-wide">Expense</span>
                </div>
              </div>
              <p className="text-5xl font-black mb-3">
                ¥{Math.abs(summary?.total_expense || 0).toLocaleString()}
              </p>
              <p className="text-rose-100 flex items-center space-x-2">
                <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-bold">本月支出</span>
                <span className="text-sm">💸 合理消费</span>
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <span className="text-6xl">💸</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-0 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-xs font-bold uppercase tracking-wide">Balance</span>
                </div>
              </div>
              <p className="text-5xl font-black mb-3">
                ¥{summary?.balance.toLocaleString() || '0'}
              </p>
              <p className="text-indigo-100 flex items-center space-x-2">
                <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-bold">结余</span>
                <span className="text-sm">📈 财务健康</span>
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <span className="text-6xl">💎</span>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights Section - Enhanced */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 shadow-lg">
              <span className="text-4xl">🤖</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">AI 财务洞察</h2>
              <p className="text-gray-600 text-sm mt-1">基于您的消费数据生成的智能建议</p>
            </div>
          </div>
          {!insightsLoading && (
            <button
              onClick={loadData}
              className="px-5 py-3 text-sm font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-xl transition-all hover:shadow-lg"
            >
              🔄 刷新洞察
            </button>
          )}
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-2xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <Card className="text-center py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-100">
            <div className="inline-block p-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
              <span className="text-7xl">📊</span>
            </div>
            <p className="text-gray-800 text-2xl font-bold mb-3">暂无财务洞察</p>
            <p className="text-gray-600 max-w-md mx-auto">添加更多交易记录后，AI 将为您提供个性化的财务建议和分析</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight, index) => {
              const styles = getSeverityStyles(insight.severity);
              return (
                <Card
                  key={index}
                  className={`${styles.bg} ${styles.border} hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${styles.shadow}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${styles.iconBg} rounded-2xl p-5 flex-shrink-0 shadow-lg text-white`}>
                      <span className="text-4xl">{insight.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold ${styles.textColor} mb-2`}>
                        {insight.title}
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
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

      {/* Charts Section - Enhanced 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-gray-900 flex items-center">
              <span className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl p-3 mr-3 text-white shadow-lg">
                <span className="text-3xl">🥧</span>
              </span>
              支出分布
            </h3>
          </div>
          {categories.length === 0 ? (
            <div className="text-center py-24">
              <span className="text-8xl block mb-6">📊</span>
              <p className="text-gray-600 text-lg font-semibold">暂无数据</p>
              <p className="text-gray-500 text-sm mt-2">开始记录交易即可查看分析</p>
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
                  strokeWidth={3}
                  stroke="#fff"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `¥${typeof value === 'number' ? value.toFixed(2) : '0.00'}`}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '2px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-gray-900 flex items-center">
              <span className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-3 mr-3 text-white shadow-lg">
                <span className="text-3xl">📊</span>
              </span>
              支出排行
            </h3>
          </div>
          {categories.length === 0 ? (
            <div className="text-center py-24">
              <span className="text-8xl block mb-6">📈</span>
              <p className="text-gray-600 text-lg font-semibold">暂无数据</p>
              <p className="text-gray-500 text-sm mt-2">开始记录交易即可查看分析</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#4B5563', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 13, fill: '#4B5563', fontWeight: 600 }} />
                <Tooltip
                  formatter={(value: any) => `¥${typeof value === 'number' ? value.toFixed(2) : '0.00'}`}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '2px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="amount" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bottom Section - Enhanced 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-gray-900 flex items-center">
              <span className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-3 mr-3 text-white shadow-lg">
                <span className="text-3xl">📋</span>
              </span>
              详细分类
            </h3>
          </div>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-12">暂无分类数据</p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat, idx) => {
                const percentage = cat.percentage;
                return (
                  <div key={cat.name} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border-2 border-transparent hover:border-purple-200">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{COLORS[idx % COLORS.length] === '#8B5CF6' ? '💼' : COLORS[idx % COLORS.length] === '#EC4899' ? '🍽️' : '💰'}</span>
                        <span className="font-bold text-gray-900 text-lg">{cat.name}</span>
                      </div>
                      <span className="text-xl font-black text-gray-800">
                        ¥{Math.abs(cat.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(to right, ${COLORS[idx % COLORS.length]}, ${COLORS[(idx + 1) % COLORS.length]})`
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 font-semibold">{percentage.toFixed(1)}% 总支出</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-gray-900 flex items-center">
              <span className="bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl p-3 mr-3 text-white shadow-lg">
                <span className="text-3xl">⚡</span>
              </span>
              快速操作
            </h3>
          </div>
          <div className="space-y-4">
            <Link
              to="/app/transactions"
              className="flex items-center p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl hover:from-blue-600 hover:to-indigo-700 hover:shadow-2xl transition-all transform hover:scale-[1.02] text-white group"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 mr-5 shadow-xl group-hover:scale-110 transition-transform duration-300">
                <span className="text-5xl">📝</span>
              </div>
              <div>
                <p className="font-black text-xl mb-1">查看所有交易</p>
                <p className="text-blue-100">浏览完整交易记录</p>
              </div>
            </Link>
            <Link
              to="/app/transactions/new"
              className="flex items-center p-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl hover:from-purple-600 hover:to-pink-700 hover:shadow-2xl transition-all transform hover:scale-[1.02] text-white group"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 mr-5 shadow-xl group-hover:scale-110 transition-transform duration-300">
                <span className="text-5xl">➕</span>
              </div>
              <div>
                <p className="font-black text-xl mb-1">添加新交易</p>
                <p className="text-purple-100">记录一笔收入或支出</p>
              </div>
            </Link>
            <Link
              to="/app/chat"
              className="flex items-center p-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl hover:from-emerald-600 hover:to-green-700 hover:shadow-2xl transition-all transform hover:scale-[1.02] text-white group"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 mr-5 shadow-xl group-hover:scale-110 transition-transform duration-300">
                <span className="text-5xl">🤖</span>
              </div>
              <div>
                <p className="font-black text-xl mb-1">AI 财务顾问</p>
                <p className="text-emerald-100">智能分析和建议</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
