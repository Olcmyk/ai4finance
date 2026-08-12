import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { analyticsApi } from '../api/analytics';
import type { Summary, CategoryBreakdown, Insight } from '../api/analytics';
import { LuxuryCard, LuxuryButton } from '../components/luxury';

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
          border: 'border-l-4 border-expense',
          bg: 'bg-gradient-to-br from-expense-light/30 via-white to-white',
          iconBg: 'bg-gradient-to-br from-expense to-expense-dark',
          textColor: 'text-luxury-darkBrown',
        };
      case 'important':
        return {
          border: 'border-l-4 border-luxury-gold',
          bg: 'bg-gradient-to-br from-luxury-lightBeige/50 via-white to-white',
          iconBg: 'bg-gradient-to-br from-luxury-gold to-luxury-darkGold',
          textColor: 'text-luxury-darkBrown',
        };
      case 'warning':
        return {
          border: 'border-l-4 border-luxury-lightGold',
          bg: 'bg-gradient-to-br from-luxury-cream via-white to-white',
          iconBg: 'bg-gradient-to-br from-luxury-lightGold to-luxury-gold',
          textColor: 'text-luxury-darkBrown',
        };
      case 'info':
      default:
        return {
          border: 'border-l-4 border-income',
          bg: 'bg-gradient-to-br from-income-light/30 via-white to-white',
          iconBg: 'bg-gradient-to-br from-income to-income-dark',
          textColor: 'text-luxury-darkBrown',
        };
    }
  };

  const LUXURY_COLORS = ['#D4AF37', '#C9B591', '#B8860B', '#8B7355', '#DAA520', '#B49D76'];

  const pieChartData = categories.map((cat, index) => ({
    name: cat.name,
    value: Math.abs(cat.amount),
    color: LUXURY_COLORS[index % LUXURY_COLORS.length],
  }));

  const barChartData = categories
    .slice(0, 5)
    .map((cat, index) => ({
      name: cat.name,
      amount: Math.abs(cat.amount),
      fill: LUXURY_COLORS[index % LUXURY_COLORS.length],
    }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-luxury-border border-t-luxury-gold"></div>
          </div>
          <p className="mt-6 text-luxury-darkBrown font-medium text-lg tracking-wide">加载数据中...</p>
          <p className="mt-2 text-luxury-brown text-sm tracking-wide">正在为您准备财务分析</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Header */}
      <LuxuryCard className="bg-gradient-to-r from-luxury-gold via-luxury-lightGold to-luxury-beige border-0 overflow-hidden relative p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-md border border-white/30">
                <span className="text-sm font-medium tracking-wide">财务概览</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-md border border-white/30">
                <span className="text-sm font-medium tracking-wide">{summary?.month}</span>
              </div>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 leading-tight tracking-wide">
              {getGreeting()}
            </h1>
            <p className="text-white/90 text-lg tracking-wide">
              让我们一起分析您的财务状况
            </p>
          </div>
          <Link to="/app/transactions/new">
            <LuxuryButton variant="secondary" className="bg-white text-luxury-gold hover:bg-luxury-cream">
              新建交易
            </LuxuryButton>
          </Link>
        </div>
      </LuxuryCard>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LuxuryCard hover className="bg-gradient-to-br from-income to-income-dark border-0 text-white p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-md">
                <span className="text-xs font-medium uppercase tracking-wider">INCOME</span>
              </div>
            </div>
            <p className="font-mono text-5xl font-bold mb-3">
              ¥{formatCurrency(summary?.total_income || 0)}
            </p>
            <p className="text-white/80 flex items-center space-x-2 text-sm">
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium tracking-wide">本月收入</span>
            </p>
          </div>
        </LuxuryCard>

        <LuxuryCard hover className="bg-gradient-to-br from-expense to-expense-dark border-0 text-white p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-md">
                <span className="text-xs font-medium uppercase tracking-wider">EXPENSE</span>
              </div>
            </div>
            <p className="font-mono text-5xl font-bold mb-3">
              ¥{formatCurrency(Math.abs(summary?.total_expense || 0))}
            </p>
            <p className="text-white/80 flex items-center space-x-2 text-sm">
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium tracking-wide">本月支出</span>
            </p>
          </div>
        </LuxuryCard>

        <LuxuryCard hover className="bg-gradient-to-br from-luxury-gold to-luxury-darkGold border-0 text-white p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-md">
                <span className="text-xs font-medium uppercase tracking-wider">BALANCE</span>
              </div>
            </div>
            <p className="font-mono text-5xl font-bold mb-3">
              ¥{formatCurrency(summary?.balance || 0)}
            </p>
            <p className="text-white/80 flex items-center space-x-2 text-sm">
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium tracking-wide">结余</span>
            </p>
          </div>
        </LuxuryCard>
      </div>

      {/* AI Insights Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-3xl font-bold text-luxury-gold tracking-wide">AI 财务洞察</h2>
            <p className="text-luxury-brown text-sm mt-1 tracking-wide">基于您的消费数据生成的智能建议</p>
          </div>
          {!insightsLoading && (
            <button
              onClick={loadData}
              className="px-5 py-3 text-sm font-medium text-luxury-darkBrown bg-luxury-cream hover:bg-luxury-lightBeige rounded-md transition-all border border-luxury-border"
            >
              刷新洞察
            </button>
          )}
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <LuxuryCard key={i} className="animate-pulse p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-luxury-lightBeige rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-luxury-lightBeige rounded w-3/4"></div>
                    <div className="h-4 bg-luxury-lightBeige rounded"></div>
                    <div className="h-4 bg-luxury-lightBeige rounded w-5/6"></div>
                  </div>
                </div>
              </LuxuryCard>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <LuxuryCard className="text-center py-20 bg-luxury-cream border-2 border-luxury-border">
            <p className="text-luxury-darkBrown text-2xl font-display font-bold mb-3 tracking-wide">暂无财务洞察</p>
            <p className="text-luxury-brown max-w-md mx-auto tracking-wide">添加更多交易记录后，AI 将为您提供个性化的财务建议和分析</p>
          </LuxuryCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight, index) => {
              const styles = getSeverityStyles(insight.severity);
              return (
                <LuxuryCard
                  key={index}
                  hover
                  className={`${styles.bg} ${styles.border} p-6`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${styles.iconBg} rounded-lg p-4 flex-shrink-0 shadow-luxury text-white`}>
                      <span className="text-3xl">{insight.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-medium ${styles.textColor} mb-2 tracking-wide`}>
                        {insight.title}
                      </h3>
                      <p className="text-luxury-brown text-sm leading-relaxed">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </LuxuryCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LuxuryCard hover className="p-8 border-2 border-luxury-border">
          <h3 className="font-display text-2xl font-bold text-luxury-darkBrown mb-6 tracking-wide">
            支出分布
          </h3>
          {categories.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-luxury-brown text-lg font-medium tracking-wide">暂无数据</p>
              <p className="text-luxury-brown text-sm mt-2 tracking-wide">开始记录交易即可查看分析</p>
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
                    borderRadius: '8px',
                    border: '1px solid #E8DCC8',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </LuxuryCard>

        <LuxuryCard hover className="p-8 border-2 border-luxury-border">
          <h3 className="font-display text-2xl font-bold text-luxury-darkBrown mb-6 tracking-wide">
            支出排行
          </h3>
          {categories.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-luxury-brown text-lg font-medium tracking-wide">暂无数据</p>
              <p className="text-luxury-brown text-sm mt-2 tracking-wide">开始记录交易即可查看分析</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC8" />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#4A3F2E', fontWeight: 500 }} />
                <YAxis tick={{ fontSize: 13, fill: '#4A3F2E', fontWeight: 500 }} />
                <Tooltip
                  formatter={(value: any) => `¥${typeof value === 'number' ? formatCurrency(value) : '0.00'}`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E8DCC8',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.1)',
                  }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </LuxuryCard>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LuxuryCard hover className="p-8 border-2 border-luxury-border">
          <h3 className="font-display text-2xl font-bold text-luxury-darkBrown mb-6 tracking-wide">
            详细分类
          </h3>
          {categories.length === 0 ? (
            <p className="text-luxury-brown text-center py-12 tracking-wide">暂无分类数据</p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat, idx) => {
                const percentage = cat.percentage;
                return (
                  <div key={cat.name} className="bg-luxury-cream rounded-lg p-5 hover:bg-luxury-lightBeige transition-all duration-300 border border-luxury-border">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-luxury-darkBrown text-lg tracking-wide">{cat.name}</span>
                      <span className="font-mono text-xl font-bold text-luxury-darkBrown">
                        ¥{formatCurrency(Math.abs(cat.amount))}
                      </span>
                    </div>
                    <div className="w-full bg-luxury-lightBeige rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(to right, ${LUXURY_COLORS[idx % LUXURY_COLORS.length]}, ${LUXURY_COLORS[(idx + 1) % LUXURY_COLORS.length]})`
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-luxury-brown mt-2 font-medium tracking-wide">{percentage.toFixed(1)}% 总支出</p>
                  </div>
                );
              })}
            </div>
          )}
        </LuxuryCard>

        <LuxuryCard hover className="p-8 border-2 border-luxury-border">
          <h3 className="font-display text-2xl font-bold text-luxury-darkBrown mb-6 tracking-wide">
            快速操作
          </h3>
          <div className="space-y-4">
            <Link
              to="/app/transactions"
              className="flex items-center p-6 bg-luxury-cream rounded-lg hover:bg-luxury-lightBeige hover:shadow-luxury-md transition-all border border-luxury-border group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-luxury-cream transition-colors duration-300 border border-luxury-border">
                <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="font-medium text-luxury-darkBrown text-lg tracking-wide">查看所有交易</p>
                <p className="text-luxury-brown text-sm tracking-wide">浏览完整交易记录</p>
              </div>
            </Link>
            <Link
              to="/app/transactions/new"
              className="flex items-center p-6 bg-luxury-cream rounded-lg hover:bg-luxury-lightBeige hover:shadow-luxury-md transition-all border border-luxury-border group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:bg-luxury-cream transition-colors duration-300 border border-luxury-border">
                <svg className="w-6 h-6 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="font-medium text-luxury-darkBrown text-lg tracking-wide">添加新交易</p>
                <p className="text-luxury-brown text-sm tracking-wide">记录一笔收入或支出</p>
              </div>
            </Link>
          </div>
        </LuxuryCard>
      </div>
    </div>
  );
};

export default Dashboard;
