// function Dashboard() {
//     return (
//         <div className="p-10">
//             <h1 className="text-3xl font-bold">
//                 Dashboard is working!
//             </h1>
//         </div>
//     );
// }

// export default Dashboard;

import { useEffect, useState } from 'react';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    LogOut,
    RefreshCw
} from 'lucide-react';

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount || 0);

function Dashboard() {
    const { logout } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await API.get('/dashboard');

            setData(response.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load dashboard data.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const summary = data?.summary || {};
    const monthly = data?.monthly || {};
    const yearly = data?.yearly || {};

    const categoryData = data?.categoryBreakdown || [];
    const recentTransactions = data?.recentTransactions || [];

    const COLORS = [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#8B5CF6',
        '#EF4444',
        '#06B6D4'
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Expense Tracker
                    </h1>
                    <p className="text-sm text-gray-500">
                        Manage your money smartly
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={fetchDashboard}
                        className="p-2 rounded-lg border hover:bg-gray-100"
                        title="Refresh"
                    >
                        <RefreshCw size={20} />
                    </button>

                    <button
                        onClick={logout}
                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </header>

            <main className="p-6 max-w-7xl mx-auto">

                <h2 className="text-xl font-semibold mb-6">
                    Financial Overview
                </h2>

                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                        {error}
                        <button
                            onClick={fetchDashboard}
                            className="underline ml-2"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500">Total Balance</p>
                            <Wallet className="text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-bold mt-4">
                            {formatCurrency(summary.balance)}
                        </h2>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500">Total Income</p>
                            <TrendingUp className="text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-green-600 mt-4">
                            {formatCurrency(summary.totalIncome)}
                        </h2>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500">Total Expenses</p>
                            <TrendingDown className="text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-red-600 mt-4">
                            {formatCurrency(summary.totalExpense)}
                        </h2>
                    </div>
                </div>

                {/* Monthly and Yearly Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">
                            This Month
                        </h3>

                        <p className="text-gray-500">
                            Income: <span className="text-green-600 font-semibold">
                                {formatCurrency(monthly.income)}
                            </span>
                        </p>

                        <p className="text-gray-500 mt-2">
                            Expenses: <span className="text-red-600 font-semibold">
                                {formatCurrency(monthly.expense)}
                            </span>
                        </p>

                        <p className="text-gray-800 font-bold mt-4">
                            Balance: {formatCurrency(monthly.balance)}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">
                            This Year
                        </h3>

                        <p className="text-gray-500">
                            Income: <span className="text-green-600 font-semibold">
                                {formatCurrency(yearly.income)}
                            </span>
                        </p>

                        <p className="text-gray-500 mt-2">
                            Expenses: <span className="text-red-600 font-semibold">
                                {formatCurrency(yearly.expense)}
                            </span>
                        </p>

                        <p className="text-gray-800 font-bold mt-4">
                            Balance: {formatCurrency(yearly.balance)}
                        </p>
                    </div>
                </div>

                {/* Category Chart and Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">
                            Expense Categories
                        </h3>

                        {categoryData.length > 0 ? (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            dataKey="amount"
                                            nameKey="category"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label
                                        >
                                            {categoryData.map((item, index) => (
                                                <Cell
                                                    key={item.category}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) =>
                                                formatCurrency(value)
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-gray-500 py-10 text-center">
                                No expense data available yet.
                            </p>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">
                            Recent Transactions
                        </h3>

                        {recentTransactions.length > 0 ? (
                            <div className="space-y-4">
                                {recentTransactions.map((transaction) => (
                                    <div
                                        key={transaction._id}
                                        className="flex justify-between items-center border-b pb-3"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {transaction.title}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {transaction.category} · {' '}
                                                {new Date(
                                                    transaction.date
                                                ).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>

                                        <p className={`font-semibold ${
                                            transaction.type === 'income'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}>
                                            {transaction.type === 'income'
                                                ? '+'
                                                : '-'}
                                            {formatCurrency(transaction.amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 py-10 text-center">
                                No transactions available yet.
                            </p>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}

export default Dashboard;
