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
    const color = num < 0 ? 'text-red-600' : 'text-green-600';
    return <span className={color}>¥{Math.abs(num).toFixed(2)}</span>;
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
    return <div className="text-center py-10">加载中...</div>;
  }

  const groupedTransactions = groupByDate(transactions);

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">交易记录</h1>
        <Link
          to="/app/transactions/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          + 新建交易
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg">
          <p className="text-gray-500">暂无交易记录</p>
          <Link to="/app/transactions/new" className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
            添加第一笔交易
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {Object.entries(groupedTransactions).map(([date, items]) => (
            <div key={date} className="border-b border-gray-200 last:border-0">
              <div className="bg-gray-50 px-4 py-2">
                <h3 className="text-sm font-medium text-gray-700">{date}</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {items.map((transaction) => (
                  <li key={transaction.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.category}
                          </p>
                          <p className="text-sm font-semibold">
                            {formatAmount(transaction.amount)}
                          </p>
                        </div>
                        {transaction.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            第 {page} 页 / 共 {Math.ceil(total / 20)} 页
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
