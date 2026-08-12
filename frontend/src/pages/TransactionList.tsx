import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transactionsApi } from '../api/transactions';
import type { Transaction } from '../types/transaction';
import { LuxuryCard, LuxuryButton } from '../components/luxury';

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

    const color = num < 0 ? 'text-expense' : 'text-income';
    const prefix = num < 0 ? '-' : '+';
    return <span className={`${color} font-mono font-bold`}>{prefix}¥{formattedValue}</span>;
  };

  const getCategoryIcon = (category: string) => {
    // Simple icon mapping - elegant symbols instead of emoji
    const icons: Record<string, string> = {
      '餐饮': '◆',
      '交通': '▸',
      '购物': '◇',
      '娱乐': '○',
      '医疗': '△',
      '教育': '◈',
      '住房': '▣',
      '工资': '◆',
      '投资': '◈',
    };
    return icons[category] || '◆';
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
        <div className="text-luxury-brown text-lg tracking-wide">加载中...</div>
      </div>
    );
  }

  const groupedTransactions = groupByDate(transactions);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-4xl font-bold text-luxury-gold tracking-wide">交易记录</h1>
          <p className="text-luxury-brown mt-2 tracking-wide">管理您的所有财务交易</p>
        </div>
        <Link to="/app/transactions/new">
          <LuxuryButton variant="primary">
            新建交易
          </LuxuryButton>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <LuxuryCard className="text-center py-20">
          <p className="text-luxury-brown text-lg font-medium tracking-wide mb-4">暂无交易记录</p>
          <Link to="/app/transactions/new">
            <LuxuryButton variant="outline">
              添加第一笔交易
            </LuxuryButton>
          </Link>
        </LuxuryCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, items]) => (
            <LuxuryCard key={date} className="overflow-hidden">
              {/* Date Header */}
              <div className="bg-luxury-lightBeige border-b border-luxury-border px-6 py-3">
                <h3 className="text-sm font-medium text-luxury-darkBrown uppercase tracking-wider">{date}</h3>
              </div>

              {/* Transactions */}
              <div className="divide-y divide-luxury-border">
                {items.map((transaction, index) => {
                  return (
                    <div
                      key={transaction.id}
                      className={`px-6 py-5 hover:bg-luxury-cream transition-colors duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-luxury-cream/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Category Icon */}
                          <span className="text-luxury-gold text-xl">
                            {getCategoryIcon(transaction.category)}
                          </span>

                          {/* Category and Description */}
                          <div className="flex-1">
                            <p className="text-base font-medium text-luxury-darkBrown tracking-wide">
                              {transaction.category}
                            </p>
                            {transaction.description && (
                              <p className="text-sm text-luxury-brown mt-1 tracking-wide">
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
                          className="text-sm text-expense hover:text-expense-dark transition-colors duration-200 font-medium tracking-wide"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </LuxuryCard>
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
              border border-luxury-border
              rounded-md
              text-sm font-medium tracking-wide
              transition-all duration-300
              ${page === 1
                ? 'text-luxury-brown/50 bg-luxury-cream cursor-not-allowed'
                : 'text-luxury-darkBrown bg-white hover:bg-luxury-cream hover:border-luxury-gold'
              }
            `}
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-luxury-darkBrown font-medium tracking-wide">
            第 {page} 页 / 共 {Math.ceil(total / 20)} 页
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className={`
              px-6 py-3
              border border-luxury-border
              rounded-md
              text-sm font-medium tracking-wide
              transition-all duration-300
              ${page >= Math.ceil(total / 20)
                ? 'text-luxury-brown/50 bg-luxury-cream cursor-not-allowed'
                : 'text-luxury-darkBrown bg-white hover:bg-luxury-cream hover:border-luxury-gold'
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
