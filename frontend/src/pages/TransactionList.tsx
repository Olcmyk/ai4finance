import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionsApi } from '../api/transactions';
import type { Transaction } from '../types/transaction';
import { Button, Card } from '../components/ui';

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
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-beige-900">交易记录</h1>
        <Link to="/app/transactions/new">
          <Button className="mt-4 sm:mt-0">
            + 新建交易
          </Button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <Card className="text-center py-12">
          <span className="text-6xl block mb-4">📝</span>
          <p className="text-beige-600 mb-4">暂无交易记录</p>
          <Link to="/app/transactions/new">
            <Button variant="primary">添加第一笔交易</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([date, items]) => (
            <Card key={date} padding="none">
              <div className="bg-beige-100 px-6 py-3 rounded-t-2xl">
                <h3 className="text-sm font-semibold text-beige-800">{date}</h3>
              </div>
              <div className="divide-y divide-beige-200">
                {items.map((transaction) => (
                  <div key={transaction.id} className="px-6 py-4 hover:bg-beige-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-beige-900">
                            {transaction.category}
                          </p>
                          <div className="text-sm">
                            {formatAmount(transaction.amount)}
                          </div>
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-beige-600">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-all duration-200"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="mt-6 flex justify-center items-center space-x-4">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
            size="sm"
          >
            上一页
          </Button>
          <span className="px-4 py-2 text-sm text-beige-700 font-medium">
            第 {page} 页 / 共 {Math.ceil(total / 20)} 页
          </span>
          <Button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            variant="outline"
            size="sm"
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
