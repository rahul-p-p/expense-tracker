
import { useEffect, useState } from 'react';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    RefreshCw
} from 'lucide-react';

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    LineChart,
    Line
} from 'recharts';

import API from '../services/api';
import Sidebar from '../components/Sidebar';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);

const COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EF4444',
    '#06B6D4',
    '#EC4899',
    '#84CC16'
];

const getMonthKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const getMonthLabel = (date) =>
    date.toLocaleDateString('en-IN', {
        month: 'short',
        year: '2-digit'
    });

function Dashboard() {
    const [data, setData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError('');

            const [dashboardResponse, transactionResponse] =
                await Promise.all([
                    API.get('/dashboard'),
                    API.get('/transactions', {
                        params: {
                            page: 1,
                            limit: 100
                        }
                    })
                ]);

            setData(dashboardResponse.data);
            setTransactions(
                transactionResponse.data.transactions || []
            );
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

    // LAST 6 MONTHS CHART DATA
    const monthlyChartData = (() => {
        const result = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setDate(1);
            date.setMonth(date.getMonth() - i);

            const key = getMonthKey(date);

            const monthTransactions = transactions.filter(
                (transaction) => {
                    const transactionDate = new Date(transaction.date);
                    return getMonthKey(transactionDate) === key;
                }
            );

            const income = monthTransactions
                .filter((item) => item.type === 'income')
                .reduce((sum, item) => sum + Number(item.amount), 0);

            const expense = monthTransactions
                .filter((item) => item.type === 'expense')
                .reduce((sum, item) => sum + Number(item.amount), 0);

            result.push({
                month: getMonthLabel(date),
                income,
                expense
            });
        }

        return result;
    })();

    // CURRENT YEAR CHART DATA
    const yearlyChartData = (() => {
        const currentYear = new Date().getFullYear();

        return Array.from({ length: 12 }, (_, index) => {
            const date = new Date(currentYear, index, 1);
            const key = getMonthKey(date);

            const monthTransactions = transactions.filter(
                (transaction) => {
                    const transactionDate = new Date(transaction.date);
                    return getMonthKey(transactionDate) === key;
                }
            );

            return {
                month: date.toLocaleDateString('en-IN', {
                    month: 'short'
                }),
                income: monthTransactions
                    .filter((item) => item.type === 'income')
                    .reduce((sum, item) => sum + Number(item.amount), 0),
                expense: monthTransactions
                    .filter((item) => item.type === 'expense')
                    .reduce((sum, item) => sum + Number(item.amount), 0)
            };
        });
    })();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 md:pl-64">
            <Sidebar />

            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Expense Tracker
                    </h1>
                    <p className="text-sm text-gray-500">
                        Manage your money smartly
                    </p>
                </div>

                <button
                    onClick={fetchDashboard}
                    className="p-2 rounded-lg border hover:bg-gray-100"
                    title="Refresh"
                >
                    <RefreshCw size={20} />
                </button>
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

                {/* SUMMARY CARDS */}
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

                {/* MONTHLY AND YEARLY SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">
                            This Month
                        </h3>

                        <p className="text-gray-500">
                            Income:{' '}
                            <span className="text-green-600 font-semibold">
                                {formatCurrency(monthly.income)}
                            </span>
                        </p>

                        <p className="text-gray-500 mt-2">
                            Expenses:{' '}
                            <span className="text-red-600 font-semibold">
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
                            Income:{' '}
                            <span className="text-green-600 font-semibold">
                                {formatCurrency(yearly.income)}
                            </span>
                        </p>

                        <p className="text-gray-500 mt-2">
                            Expenses:{' '}
                            <span className="text-red-600 font-semibold">
                                {formatCurrency(yearly.expense)}
                            </span>
                        </p>

                        <p className="text-gray-800 font-bold mt-4">
                            Balance: {formatCurrency(yearly.balance)}
                        </p>
                    </div>
                </div>

                {/* MONTHLY INCOME VS EXPENSE */}
                <div className="bg-white p-6 rounded-xl shadow-sm mt-6">
                    <h3 className="font-semibold text-lg mb-1">
                        Monthly Income vs Expenses
                    </h3>

                    <p className="text-sm text-gray-500 mb-5">
                        Financial comparison for the last 6 months
                    </p>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis
                                    tickFormatter={(value) =>
                                        `₹${value >= 1000
                                            ? `${value / 1000}k`
                                            : value}`
                                    }
                                />
                                <Tooltip
                                    formatter={(value) =>
                                        formatCurrency(value)
                                    }
                                />
                                <Legend />
                                <Bar
                                    dataKey="income"
                                    name="Income"
                                    fill="#10B981"
                                    radius={[5, 5, 0, 0]}
                                />
                                <Bar
                                    dataKey="expense"
                                    name="Expenses"
                                    fill="#EF4444"
                                    radius={[5, 5, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* YEARLY FINANCIAL TREND */}
                <div className="bg-white p-6 rounded-xl shadow-sm mt-6">
                    <h3 className="font-semibold text-lg mb-1">
                        Yearly Financial Trend
                    </h3>

                    <p className="text-sm text-gray-500 mb-5">
                        Income and expenses across the current year
                    </p>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={yearlyChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis
                                    tickFormatter={(value) =>
                                        `₹${value >= 1000
                                            ? `${value / 1000}k`
                                            : value}`
                                    }
                                />
                                <Tooltip
                                    formatter={(value) =>
                                        formatCurrency(value)
                                    }
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    name="Income"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expense"
                                    name="Expenses"
                                    stroke="#EF4444"
                                    strokeWidth={3}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CATEGORY CHART AND RECENT TRANSACTIONS */}
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
                                            innerRadius={55}
                                            paddingAngle={3}
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

                                        <Legend />
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
                                        className="flex justify-between items-center border-b pb-3 gap-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">
                                                {transaction.title}
                                            </p>

                                            <p className="text-sm text-gray-500">
                                                {transaction.category} ·{' '}
                                                {new Date(
                                                    transaction.date
                                                ).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>

                                        <p
                                            className={`font-semibold whitespace-nowrap ${
                                                transaction.type === 'income'
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                            }`}
                                        >
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
