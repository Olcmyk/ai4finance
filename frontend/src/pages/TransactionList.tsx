import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionsApi } from '../api/transactions';
import type { Transaction } from '../types/transaction';

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, [page]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsApi.getAll({ page, page_size: 20 });
      setTransactions(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条交易记录吗？')) return;

    try {
      await transactionsApi.delete(id);
      loadTransactions();
    } catch (error) {
      alert('删除失败，请重试');
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    const formattedValue = Math.abs(num).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const color = num < 0 ? 'text-red-600' : 'text-success-600';
    const prefix = num < 0 ? '-' : '+';
    return <span className={`${color} font-mono font-semibold`} style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}¥{formattedValue}</span>;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactElement> = {
      '餐饮': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      '交通': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
      '购物': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
      '娱乐': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      '医疗': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
      '教育': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      '住房': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      '工资': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      '投资': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    };
    return icons[category] || <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  };

  const groupByDate = (transactions: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      if (!groups[t.transaction_date]) {
        groups[t.transaction_date] = [];
      }
      groups[t.transaction_date].push(t);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600 text-lg">加载中...</div>
      </div>
    );
  }

  const groupedTransactions = groupByDate(transactions);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">交易记录</h1>
          <p className="text-gray-600 mt-2">管理您的所有财务交易</p>
        </div>
        <Link to="/app/transactions/new">
          <button className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm">
            新建交易
          </button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-20 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium mb-4">暂无交易记录</p>
          <Link to="/app/transactions/new">
            <button className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm">
              添加第一笔交易
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([date, items]) => (
            <div key={date} className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
              {/* Date Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h3 className="text-sm font-semibold text-gray-700">{date}</h3>
              </div>

              {/* Transactions */}
              <div className="divide-y divide-gray-100">
                {items.map((transaction) => {
                  return (
                    <div
                      key={transaction.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Category Icon */}
                          <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                            {getCategoryIcon(transaction.category)}
                          </div>

                          {/* Category and Description */}
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-gray-900">
                              {transaction.category}
                            </p>
                            {transaction.description && (
                              <p className="text-sm text-gray-500 mt-0.5 truncate">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right mr-6">
                          <span className="text-lg">
                            {formatAmount(transaction.amount)}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-sm text-gray-400 hover:text-red-600 transition-colors duration-200 font-medium"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`
              px-6 py-3
              border border-gray-200
              rounded-lg
              text-sm font-medium
              transition-all duration-200
              ${page === 1
                ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50 hover:border-primary-300'
              }
            `}
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-700 font-medium">
            第 {page} 页 / 共 {Math.ceil(total / 20)} 页
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className={`
              px-6 py-3
              border border-gray-200
              rounded-lg
              text-sm font-medium
              transition-all duration-200
              ${page >= Math.ceil(total / 20)
                ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50 hover:border-primary-300'
              }
            `}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
