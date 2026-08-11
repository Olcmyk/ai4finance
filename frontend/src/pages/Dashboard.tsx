import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    return <div className="text-center py-10">加载中...</div>;
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'success':
        return {
          border: 'border-l-4 border-green-500',
          bg: 'bg-gradient-to-r from-green-50 to-white',
          iconBg: 'bg-green-100',
          textColor: 'text-green-800',
        };
      case 'warning':
        return {
          border: 'border-l-4 border-yellow-500',
          bg: 'bg-gradient-to-r from-yellow-50 to-white',
          iconBg: 'bg-yellow-100',
          textColor: 'text-yellow-800',
        };
      case 'info':
      default:
        return {
          border: 'border-l-4 border-blue-500',
          bg: 'bg-gradient-to-r from-blue-50 to-white',
          iconBg: 'bg-blue-100',
          textColor: 'text-blue-800',
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">财务概览</h1>
        <Link
          to="/app/transactions/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          + 新建交易
        </Link>
      </div>

      {/* AI Insights Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">AI 财务洞察</h2>
          {!insightsLoading && (
            <button
              onClick={loadData}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              刷新
            </button>
          )}
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <span className="text-4xl mb-3 block">📊</span>
            <p className="text-gray-500">暂无财务洞察</p>
            <p className="text-sm text-gray-400 mt-1">添加更多交易记录后，AI 将为您提供个性化建议</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => {
              const styles = getSeverityStyles(insight.severity);
              return (
                <div
                  key={index}
                  className={`${styles.bg} ${styles.border} rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-5`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${styles.iconBg} rounded-full p-3 flex-shrink-0`}>
                      <span className="text-3xl">{insight.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold ${styles.textColor} mb-2`}>
                        {insight.title}
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  本月收入
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  ¥{summary?.total_income.toFixed(2) || '0.00'}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  本月支出
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-red-600">
                  ¥{summary?.total_expense.toFixed(2) || '0.00'}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  结余
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  ¥{summary?.balance.toFixed(2) || '0.00'}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">支出类别</h3>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无数据</p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {cat.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ¥{cat.amount.toFixed(2)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/app/transactions"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span className="text-2xl mr-3">📝</span>
            <div>
              <p className="font-medium text-gray-900">查看所有交易</p>
              <p className="text-sm text-gray-500">浏览完整交易记录</p>
            </div>
          </Link>
          <Link
            to="/app/transactions/new"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span className="text-2xl mr-3">➕</span>
            <div>
              <p className="font-medium text-gray-900">添加新交易</p>
              <p className="text-sm text-gray-500">记录一笔收入或支出</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
