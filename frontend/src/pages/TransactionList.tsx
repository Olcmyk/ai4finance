import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionsApi } from '../api/transactions';
import type { Transaction } from '../types/transaction';
import { Button } from '../components/ui';

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
    const color = num < 0 ? 'text-beige-700' : 'text-beige-600';
    const icon = num < 0 ? '💸' : '💰';
    return (
      <span className={`${color} font-semibold flex items-center`}>
        <span className="mr-1">{icon}</span>
        ¥{Math.abs(num).toFixed(2)}
      </span>
    );
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-beige-500 mx-auto mb-4"></div>
          <p className="text-beige-700">加载中...</p>
        </div>
      </div>
    );
  }

  const groupedTransactions = groupByDate(transactions);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">交易记录</h1>
          <p className="text-gray-600 text-lg">查看和管理您的所有交易</p>
        </div>
        <Link to="/app/transactions/new">
          <Button className="mt-4 sm:mt-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <span className="text-xl mr-2">+</span> 新建交易
          </Button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl shadow-xl p-20 text-center border-2 border-purple-100">
          <div className="relative z-10">
            <div className="inline-block bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-10 mb-6 shadow-glow-purple">
              <span className="text-8xl">📝</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">暂无交易记录</h2>
            <p className="text-gray-600 mb-8 text-lg">开始记录您的第一笔交易</p>
            <Link to="/app/transactions/new">
              <Button variant="primary" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl text-lg">
                <span className="text-xl mr-2">+</span> 添加第一笔交易
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 opacity-20 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-200 opacity-20 rounded-full -ml-24 -mb-24"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, items]) => (
            <div key={date} className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📅</span>
                  <h3 className="text-lg font-black text-white">{date}</h3>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((transaction) => {
                  const isExpense = parseFloat(transaction.amount) < 0;
                  return (
                    <div key={transaction.id} className="px-8 py-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center space-x-4">
                          <div className={`${isExpense ? 'bg-gradient-to-br from-red-500 to-rose-500' : 'bg-gradient-to-br from-emerald-500 to-green-500'} rounded-2xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <span className="text-3xl">{isExpense ? '💸' : '💰'}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-lg font-bold text-gray-900">
                                {transaction.category}
                              </p>
                              <div className={`text-2xl font-black ${isExpense ? 'text-red-600' : 'text-emerald-600'}`}>
                                {formatAmount(transaction.amount)}
                              </div>
                            </div>
                            {transaction.description && (
                              <p className="text-base text-gray-600">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-6 flex-shrink-0">
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-500 text-base font-bold px-5 py-3 rounded-2xl hover:shadow-xl transition-all duration-300 border-2 border-red-200 hover:border-transparent"
                          >
                            🗑️ 删除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="mt-8 flex justify-center items-center space-x-6 bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-100">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
            size="sm"
            className="px-6 py-3 font-bold text-base rounded-2xl disabled:opacity-50"
          >
            ← 上一页
          </Button>
          <span className="px-6 py-3 text-base font-bold text-gray-900 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
            第 {page} 页 / 共 {Math.ceil(total / 20)} 页
          </span>
          <Button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            variant="outline"
            size="sm"
            className="px-6 py-3 font-bold text-base rounded-2xl disabled:opacity-50"
          >
            下一页 →
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
